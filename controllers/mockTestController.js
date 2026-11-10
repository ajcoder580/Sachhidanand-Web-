const MockTest = require('../models/mockTestModel');
const MockTestSubmission = require('../models/mockTestSubmissionModel');
const User = require('../models/userModel');

// 1. Get all published mock tests with optional filters
const getAllTests = async (req, res) => {
    try {
        const { subject, board, grade, difficulty, search } = req.query;
        let query = { status: 'published' };

        if (subject && subject !== 'All') {
            query.subject = { $regex: new RegExp(`^${subject}$`, 'i') };
        }
        if (board && board !== 'All') {
            query.board = { $regex: new RegExp(`^${board}$`, 'i') };
        }
        if (grade && grade !== 'All') {
            query.grade = { $regex: new RegExp(`^${grade}$`, 'i') };
        }
        if (difficulty && difficulty !== 'All') {
            query.difficulty = difficulty;
        }
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { subject: { $regex: search, $options: 'i' } },
                { instructions: { $regex: search, $options: 'i' } }
            ];
        }

        const tests = await MockTest.find(query)
            .sort({ createdAt: -1 })
            .select('-questions.correctOption -questions.explanation');

        // If user is authenticated, attach attempt information
        let userSubmissions = [];
        if (req.user && req.user.id) {
            userSubmissions = await MockTestSubmission.find({ 
                studentId: req.user.id 
            }).select('testId score totalMarks percentage passed submittedAt');
        }

        const testsWithUserStats = tests.map(test => {
            const testObj = test.toObject();
            const attempts = userSubmissions.filter(sub => sub.testId.toString() === test._id.toString());
            testObj.userAttemptsCount = attempts.length;
            if (attempts.length > 0) {
                // Find highest percentage attempt
                const bestAttempt = attempts.reduce((prev, curr) => (curr.percentage > prev.percentage ? curr : prev), attempts[0]);
                testObj.userBestScore = bestAttempt.score;
                testObj.userBestPercentage = bestAttempt.percentage;
                testObj.userPassed = bestAttempt.passed;
                testObj.latestAttemptId = attempts[attempts.length - 1]._id;
            }
            return testObj;
        });

        res.status(200).json({
            success: true,
            count: testsWithUserStats.length,
            tests: testsWithUserStats
        });
    } catch (error) {
        console.error('Error fetching mock tests:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch mock tests',
            error: error.message
        });
    }
};

// 2. Get distinct subjects available in mock tests
const getSubjects = async (req, res) => {
    try {
        const subjects = await MockTest.distinct('subject', { status: 'published' });
        res.status(200).json({
            success: true,
            subjects: subjects.sort()
        });
    } catch (error) {
        console.error('Error fetching subjects:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch subjects',
            error: error.message
        });
    }
};

// 3. Get single test by ID
// Note: If requester is test creator (teacher) or admin, questions include correctOption & explanation.
// Otherwise, correctOption and explanation are hidden to prevent cheating.
const getTestById = async (req, res) => {
    try {
        const { id } = req.params;
        const test = await MockTest.findById(id);

        if (!test) {
            return res.status(404).json({
                success: false,
                message: 'Mock test not found'
            });
        }

        const isOwnerOrAdmin = req.user && (
            req.user.role === 'admin' || 
            test.createdBy.toString() === req.user.id
        );

        let testData = test.toObject();

        if (!isOwnerOrAdmin) {
            // Strip answers and explanations for test takers
            testData.questions = testData.questions.map(q => {
                const { correctOption, explanation, ...rest } = q;
                return rest;
            });
        }

        res.status(200).json({
            success: true,
            test: testData,
            isOwnerOrAdmin
        });
    } catch (error) {
        console.error('Error fetching test by ID:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch mock test',
            error: error.message
        });
    }
};

// 4. Create a new Mock Test (Teacher or Admin)
const createTest = async (req, res) => {
    try {
        const { 
            title, 
            subject, 
            board, 
            grade, 
            duration, 
            difficulty, 
            instructions, 
            questions,
            status 
        } = req.body;

        if (!title || !subject || !duration) {
            return res.status(400).json({
                success: false,
                message: 'Title, subject, and duration are required'
            });
        }

        if (!questions || !Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one question is required to create a test'
            });
        }

        // Validate each question
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.questionText || !q.questionText.trim()) {
                return res.status(400).json({
                    success: false,
                    message: `Question ${i + 1} text cannot be empty`
                });
            }
            if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
                return res.status(400).json({
                    success: false,
                    message: `Question ${i + 1} must have at least 2 options`
                });
            }
            if (q.correctOption === undefined || q.correctOption === null || q.correctOption < 0 || q.correctOption >= q.options.length) {
                return res.status(400).json({
                    success: false,
                    message: `Question ${i + 1} must have a valid correct option selected`
                });
            }
        }

        // Fetch user info for creator name
        let teacherName = req.user.name;
        if (!teacherName) {
            const user = await User.findById(req.user.id);
            teacherName = user ? user.name : 'Faculty';
        }

        const newTest = new MockTest({
            title: title.trim(),
            subject: subject.trim(),
            board: board || 'CBSE',
            grade: grade || 'Class 10',
            duration: Number(duration),
            difficulty: difficulty || 'Medium',
            instructions: instructions || 'Read all questions carefully before answering.',
            questions,
            createdBy: req.user.id,
            createdByName: teacherName,
            createdByRole: req.user.role,
            status: status || 'published'
        });

        await newTest.save();

        res.status(201).json({
            success: true,
            message: 'Mock test created successfully!',
            test: newTest
        });
    } catch (error) {
        console.error('Error creating mock test:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating mock test',
            error: error.message
        });
    }
};

// 5. Update an existing Mock Test (Creator teacher or Admin)
const updateTest = async (req, res) => {
    try {
        const { id } = req.params;
        const test = await MockTest.findById(id);

        if (!test) {
            return res.status(404).json({
                success: false,
                message: 'Mock test not found'
            });
        }

        // Authorization check
        if (req.user.role !== 'admin' && test.createdBy.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to update this test'
            });
        }

        const { 
            title, 
            subject, 
            board, 
            grade, 
            duration, 
            difficulty, 
            instructions, 
            questions,
            status 
        } = req.body;

        if (title) test.title = title.trim();
        if (subject) test.subject = subject.trim();
        if (board) test.board = board;
        if (grade) test.grade = grade;
        if (duration) test.duration = Number(duration);
        if (difficulty) test.difficulty = difficulty;
        if (instructions !== undefined) test.instructions = instructions;
        if (status) test.status = status;

        if (questions && Array.isArray(questions) && questions.length > 0) {
            // Validate questions
            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];
                if (!q.questionText || !q.questionText.trim()) {
                    return res.status(400).json({
                        success: false,
                        message: `Question ${i + 1} text cannot be empty`
                    });
                }
                if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
                    return res.status(400).json({
                        success: false,
                        message: `Question ${i + 1} must have at least 2 options`
                    });
                }
                if (q.correctOption === undefined || q.correctOption === null || q.correctOption < 0 || q.correctOption >= q.options.length) {
                    return res.status(400).json({
                        success: false,
                        message: `Question ${i + 1} must have a valid correct option selected`
                    });
                }
            }
            test.questions = questions;
        }

        await test.save();

        res.status(200).json({
            success: true,
            message: 'Mock test updated successfully',
            test
        });
    } catch (error) {
        console.error('Error updating mock test:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update mock test',
            error: error.message
        });
    }
};

// 6. Delete a Mock Test (Creator teacher or Admin)
const deleteTest = async (req, res) => {
    try {
        const { id } = req.params;
        const test = await MockTest.findById(id);

        if (!test) {
            return res.status(404).json({
                success: false,
                message: 'Mock test not found'
            });
        }

        // Authorization check
        if (req.user.role !== 'admin' && test.createdBy.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to delete this test'
            });
        }

        await MockTest.findByIdAndDelete(id);
        // Clean up submissions for this test
        await MockTestSubmission.deleteMany({ testId: id });

        res.status(200).json({
            success: true,
            message: 'Mock test and its submissions deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting mock test:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete mock test',
            error: error.message
        });
    }
};

// 7. Submit test answers (Students / Authenticated Users)
const submitTest = async (req, res) => {
    try {
        const { id } = req.params;
        const { answers, timeSpentSeconds } = req.body;

        const test = await MockTest.findById(id);
        if (!test) {
            return res.status(404).json({
                success: false,
                message: 'Mock test not found'
            });
        }

        // Get user details
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User profile not found'
            });
        }

        const answersMap = answers || {};
        let score = 0;
        let totalMarks = 0;
        let attemptedCount = 0;
        let correctCount = 0;
        let wrongCount = 0;

        const detailedAnswers = test.questions.map((q, index) => {
            const qMarks = Number(q.marks) || 1;
            totalMarks += qMarks;

            // Student could submit with questionId as key or question index as key
            let selectedOption = answersMap[q._id.toString()];
            if (selectedOption === undefined) {
                selectedOption = answersMap[index];
            }
            if (selectedOption === undefined) {
                selectedOption = null;
            } else if (selectedOption !== null) {
                selectedOption = Number(selectedOption);
            }

            const isAttempted = selectedOption !== null && selectedOption >= 0;
            if (isAttempted) attemptedCount++;

            const isCorrect = isAttempted && selectedOption === q.correctOption;
            let marksObtained = 0;

            if (isCorrect) {
                correctCount++;
                marksObtained = qMarks;
                score += qMarks;
            } else if (isAttempted) {
                wrongCount++;
            }

            return {
                questionId: q._id,
                questionText: q.questionText,
                options: q.options,
                selectedOption: isAttempted ? selectedOption : null,
                correctOption: q.correctOption,
                isCorrect,
                marksObtained,
                marksTotal: qMarks,
                explanation: q.explanation || ''
            };
        });

        const percentage = totalMarks > 0 ? Number(((score / totalMarks) * 100).toFixed(1)) : 0;
        const passingMarks = test.passingMarks || Math.ceil(totalMarks * 0.35);
        const passed = score >= passingMarks;

        const submission = new MockTestSubmission({
            testId: test._id,
            testTitle: test.title,
            subject: test.subject,
            board: test.board,
            grade: test.grade,
            studentId: user._id,
            studentName: user.name,
            studentEmail: user.email,
            answers: detailedAnswers,
            totalQuestions: test.questions.length,
            attemptedCount,
            correctCount,
            wrongCount,
            score,
            totalMarks,
            percentage,
            passed,
            timeSpentSeconds: Number(timeSpentSeconds) || 0,
            submittedAt: new Date()
        });

        await submission.save();

        res.status(201).json({
            success: true,
            message: 'Test submitted successfully!',
            result: submission
        });
    } catch (error) {
        console.error('Error submitting test:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while submitting test',
            error: error.message
        });
    }
};

// 8. Get student's own submissions history
const getStudentSubmissions = async (req, res) => {
    try {
        const submissions = await MockTestSubmission.find({ studentId: req.user.id })
            .sort({ submittedAt: -1 });

        res.status(200).json({
            success: true,
            count: submissions.length,
            submissions
        });
    } catch (error) {
        console.error('Error fetching student submissions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch test submissions',
            error: error.message
        });
    }
};

// 9. Get specific submission result by ID
const getSubmissionById = async (req, res) => {
    try {
        const { id } = req.params;
        const submission = await MockTestSubmission.findById(id);

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: 'Submission not found'
            });
        }

        // Authorization check: student who submitted, test creator teacher, or admin
        const isOwner = submission.studentId.toString() === req.user.id;
        const isAdmin = req.user.role === 'admin';
        
        let isTeacherOfTest = false;
        if (req.user.role === 'teacher') {
            const test = await MockTest.findById(submission.testId);
            if (test && test.createdBy.toString() === req.user.id) {
                isTeacherOfTest = true;
            }
        }

        if (!isOwner && !isAdmin && !isTeacherOfTest) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this submission result'
            });
        }

        res.status(200).json({
            success: true,
            submission
        });
    } catch (error) {
        console.error('Error fetching submission details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch submission details',
            error: error.message
        });
    }
};

// 10. Get tests created by teacher with statistics (Teacher/Admin)
const getTeacherTests = async (req, res) => {
    try {
        let filter = {};
        if (req.user.role !== 'admin') {
            filter.createdBy = req.user.id;
        }

        const tests = await MockTest.find(filter).sort({ createdAt: -1 });

        // Augment tests with submission stats
        const testStats = await Promise.all(tests.map(async (test) => {
            const submissions = await MockTestSubmission.find({ testId: test._id });
            const totalSubmissions = submissions.length;
            const avgPercentage = totalSubmissions > 0
                ? Number((submissions.reduce((acc, curr) => acc + curr.percentage, 0) / totalSubmissions).toFixed(1))
                : 0;
            const passedCount = submissions.filter(s => s.passed).length;
            const passRate = totalSubmissions > 0
                ? Math.round((passedCount / totalSubmissions) * 100)
                : 0;

            const testObj = test.toObject();
            testObj.stats = {
                totalSubmissions,
                avgPercentage,
                passedCount,
                passRate
            };
            return testObj;
        }));

        res.status(200).json({
            success: true,
            count: testStats.length,
            tests: testStats
        });
    } catch (error) {
        console.error('Error fetching teacher tests:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tests',
            error: error.message
        });
    }
};

// 11. Get all submissions for a test (Teacher / Admin)
const getTestSubmissionsForTeacher = async (req, res) => {
    try {
        const { testId } = req.params;
        const test = await MockTest.findById(testId);

        if (!test) {
            return res.status(404).json({
                success: false,
                message: 'Mock test not found'
            });
        }

        // Authorization check
        if (req.user.role !== 'admin' && test.createdBy.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to view submissions for this test'
            });
        }

        const submissions = await MockTestSubmission.find({ testId })
            .sort({ score: -1, submittedAt: -1 });

        res.status(200).json({
            success: true,
            testTitle: test.title,
            subject: test.subject,
            count: submissions.length,
            submissions
        });
    } catch (error) {
        console.error('Error fetching test submissions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch test submissions',
            error: error.message
        });
    }
};

// 12. Get institute leaderboard
const getLeaderboard = async (req, res) => {
    try {
        // Aggregate top submissions
        const topSubmissions = await MockTestSubmission.find({})
            .sort({ percentage: -1, score: -1, submittedAt: -1 })
            .limit(20)
            .select('studentName testTitle subject board grade score totalMarks percentage submittedAt');

        const leaderboard = topSubmissions.map((sub, index) => ({
            rank: index + 1,
            name: sub.studentName,
            testTitle: sub.testTitle,
            subject: sub.subject,
            board: `${sub.board || 'CBSE'} ${sub.grade || 'Class 10'}`,
            score: `${sub.score} / ${sub.totalMarks} (${sub.percentage}%)`,
            rawPercentage: sub.percentage,
            date: new Date(sub.submittedAt).toLocaleDateString('en-IN')
        }));

        res.status(200).json({
            success: true,
            leaderboard
        });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch leaderboard',
            error: error.message
        });
    }
};

// 13. Seed default mock tests if empty
const seedDefaultMockTests = async () => {
    try {
        const count = await MockTest.countDocuments();
        if (count > 0) {
            console.log(`Mock tests already initialized (${count} tests found).`);
            return;
        }

        console.log('Seeding initial mock tests for various subjects...');

        // Find or create a default teacher/admin for creator reference
        let defaultCreator = await User.findOne({ role: { $in: ['teacher', 'admin'] } });
        if (!defaultCreator) {
            defaultCreator = await User.findOne({ email: 'admin@example.com' });
        }

        const creatorId = defaultCreator ? defaultCreator._id : new User()._id;
        const creatorName = defaultCreator ? defaultCreator.name : 'Senior Faculty';

        const sampleTests = [
            {
                title: "BSEB Class 10 Matric Science Mock Paper I",
                subject: "Science",
                board: "BSEB",
                grade: "Class 10",
                duration: 30,
                difficulty: "Medium",
                instructions: "All questions are compulsory. Select the single correct option for each question.",
                createdBy: creatorId,
                createdByName: creatorName,
                createdByRole: "teacher",
                status: "published",
                questions: [
                    {
                        questionText: "Which chemical compound is known as Bleaching Powder?",
                        options: ["NaHCO3", "CaOCl2", "CaSO4·1/2H2O", "Na2CO3·10H2O"],
                        correctOption: 1,
                        explanation: "Calcium hypochlorite (CaOCl2) is commonly known as Bleaching Powder, synthesized by the action of chlorine on dry slaked lime.",
                        marks: 1
                    },
                    {
                        questionText: "What is the SI unit of electric potential difference (voltage)?",
                        options: ["Ampere", "Ohm", "Volt", "Joule"],
                        correctOption: 2,
                        explanation: "Volt (V) is the SI unit of electric potential difference, named in honor of Alessandro Volta.",
                        marks: 1
                    },
                    {
                        questionText: "During photosynthesis, what gas is evolved as a byproduct?",
                        options: ["Carbon Dioxide", "Nitrogen", "Oxygen", "Methane"],
                        correctOption: 2,
                        explanation: "Water molecules (H2O) are split during the light-dependent reactions of photosynthesis (photolysis), releasing oxygen (O2).",
                        marks: 1
                    },
                    {
                        questionText: "The focal length of a concave mirror having a radius of curvature of 30 cm is:",
                        options: ["15 cm", "30 cm", "60 cm", "7.5 cm"],
                        correctOption: 0,
                        explanation: "The focal length (f) is half of the radius of curvature (R): f = R / 2 = 30 / 2 = 15 cm.",
                        marks: 1
                    },
                    {
                        questionText: "Which part of the human alimentary canal is the site of complete digestion of carbohydrates, proteins, and fats?",
                        options: ["Stomach", "Large Intestine", "Small Intestine", "Esophagus"],
                        correctOption: 2,
                        explanation: "Complete digestion occurs in the small intestine through bile juice, pancreatic enzymes, and intestinal enzymes.",
                        marks: 1
                    },
                    {
                        questionText: "An aqueous solution turns red litmus paper blue. Its pH is likely to be:",
                        options: ["1", "4", "5", "10"],
                        correctOption: 3,
                        explanation: "Bases turn red litmus paper blue and have a pH greater than 7. Therefore, pH 10 represents a basic solution.",
                        marks: 1
                    }
                ]
            },
            {
                title: "CBSE Class 10 Mathematics Standard Mock Test",
                subject: "Mathematics",
                board: "CBSE",
                grade: "Class 10",
                duration: 35,
                difficulty: "Medium",
                instructions: "Calculators are strictly not permitted. Attempt all multiple choice questions.",
                createdBy: creatorId,
                createdByName: creatorName,
                createdByRole: "teacher",
                status: "published",
                questions: [
                    {
                        questionText: "If one root of the quadratic equation 2x² + kx - 6 = 0 is 2, the value of k is:",
                        options: ["-1", "1", "2", "-2"],
                        correctOption: 0,
                        explanation: "Substitute x = 2 into 2(2)² + k(2) - 6 = 0 => 8 + 2k - 6 = 0 => 2k + 2 = 0 => k = -1.",
                        marks: 1
                    },
                    {
                        questionText: "The 10th term of the Arithmetic Progression 2, 7, 12, ... is:",
                        options: ["45", "47", "49", "52"],
                        correctOption: 1,
                        explanation: "a = 2, d = 7 - 2 = 5. a_10 = a + 9d = 2 + 9(5) = 2 + 45 = 47.",
                        marks: 1
                    },
                    {
                        questionText: "If sin θ + cos θ = √2 cos θ, then the value of tan θ is:",
                        options: ["√2 - 1", "√2 + 1", "1 / √2", "√2"],
                        correctOption: 0,
                        explanation: "sin θ = (√2 - 1) cos θ. Dividing both sides by cos θ gives tan θ = √2 - 1.",
                        marks: 1
                    },
                    {
                        questionText: "The distance of the point P(-6, 8) from the origin (0, 0) is:",
                        options: ["8", "10", "6", "14"],
                        correctOption: 1,
                        explanation: "Distance = √((-6 - 0)² + (8 - 0)²) = √(36 + 64) = √100 = 10 units.",
                        marks: 1
                    },
                    {
                        questionText: "If the perimeter and the area of a circle are numerically equal, then the radius of the circle is:",
                        options: ["2 units", "π units", "4 units", "7 units"],
                        correctOption: 0,
                        explanation: "2πr = πr² => r = 2 units (since r > 0).",
                        marks: 1
                    }
                ]
            },
            {
                title: "CBSE Class 12 Physics Full-Length Board Mock",
                subject: "Physics",
                board: "CBSE",
                grade: "Class 12",
                duration: 40,
                difficulty: "Hard",
                instructions: "Includes core electrostatics, magnetism, and optics questions according to the latest CBSE pattern.",
                createdBy: creatorId,
                createdByName: creatorName,
                createdByRole: "teacher",
                status: "published",
                questions: [
                    {
                        questionText: "Two point charges +q and -q are separated by distance 2a. The electric field on the equatorial line at distance r (where r >> a) is proportional to:",
                        options: ["1/r", "1/r²", "1/r³", "1/r⁴"],
                        correctOption: 2,
                        explanation: "The electric field of an electric dipole at an equatorial distance r is E = p / (4πε₀ r³), hence proportional to 1/r³.",
                        marks: 1
                    },
                    {
                        questionText: "A wire of resistance R is stretched uniformly so that its length becomes twice its original length. Its new resistance will be:",
                        options: ["2R", "4R", "R/2", "R/4"],
                        correctOption: 1,
                        explanation: "Volume remains constant (A * L = A' * 2L => A' = A/2). New resistance R' = ρ(2L)/(A/2) = 4 * (ρL/A) = 4R.",
                        marks: 1
                    },
                    {
                        questionText: "Lenz's Law is a consequence of which conservation principle?",
                        options: ["Conservation of Charge", "Conservation of Momentum", "Conservation of Energy", "Conservation of Mass"],
                        correctOption: 2,
                        explanation: "Lenz's law expresses the conservation of energy in electromagnetic induction.",
                        marks: 1
                    },
                    {
                        questionText: "In a Young's double-slit experiment, if the distance between the slits is halved and the screen distance is doubled, the fringe width becomes:",
                        options: ["Unchanged", "Doubled", "Four times", "Halved"],
                        correctOption: 2,
                        explanation: "Fringe width β = λD/d. With D' = 2D and d' = d/2, β' = λ(2D)/(d/2) = 4(λD/d) = 4β.",
                        marks: 1
                    }
                ]
            },
            {
                title: "BSEB Class 12 Chemistry Objective Booster Mock",
                subject: "Chemistry",
                board: "BSEB",
                grade: "Class 12",
                duration: 30,
                difficulty: "Medium",
                instructions: "Focuses on high-scoring objective questions for state board syllabus.",
                createdBy: creatorId,
                createdByName: creatorName,
                createdByRole: "teacher",
                status: "published",
                questions: [
                    {
                        questionText: "The coordination number of a metal crystallizing in a Face-Centered Cubic (FCC) lattice is:",
                        options: ["6", "8", "12", "4"],
                        correctOption: 2,
                        explanation: "In a Face-Centered Cubic (FCC) or Cubic Close Packed (CCP) unit cell, each sphere touches 12 nearest neighbors.",
                        marks: 1
                    },
                    {
                        questionText: "Which law explains the solubility of gases in liquids with pressure?",
                        options: ["Raoult's Law", "Henry's Law", "Dalton's Law", "Boyle's Law"],
                        correctOption: 1,
                        explanation: "Henry's Law states that the mass of a gas dissolved in a given volume of the liquid at constant temperature is directly proportional to the pressure of the gas.",
                        marks: 1
                    },
                    {
                        questionText: "Which of the following transitions metals shows highest oxidation state (+7)?",
                        options: ["Fe", "Cr", "Mn", "V"],
                        correctOption: 2,
                        explanation: "Manganese (Mn: 3d⁵ 4s²) has 7 valence electrons and exhibits oxidation states up to +7 (e.g. in KMnO4).",
                        marks: 1
                    },
                    {
                        questionText: "Lucas test is used to distinguish between:",
                        options: ["Primary, secondary, and tertiary alcohols", "Aldehydes and ketones", "Aliphatic and aromatic amines", "Acids and esters"],
                        correctOption: 0,
                        explanation: "The Lucas reagent (conc. HCl + anhydrous ZnCl2) reacts at different rates with primary, secondary, and tertiary alcohols.",
                        marks: 1
                    }
                ]
            },
            {
                title: "Class 10 English Language & Grammar Mastery Test",
                subject: "English",
                board: "CBSE",
                grade: "Class 10",
                duration: 25,
                difficulty: "Easy",
                instructions: "Attempt all questions. Choose the most appropriate grammatical option.",
                createdBy: creatorId,
                createdByName: creatorName,
                createdByRole: "teacher",
                status: "published",
                questions: [
                    {
                        questionText: "Neither the teacher nor the students ______ present in the auditorium.",
                        options: ["was", "were", "is", "has been"],
                        correctOption: 1,
                        explanation: "When two subjects are joined by 'neither... nor', the verb agrees with the subject closest to it ('students' is plural, so 'were' is used).",
                        marks: 1
                    },
                    {
                        questionText: "Identify the passive form: 'The chef prepared a delightful five-course meal.'",
                        options: [
                            "A delightful five-course meal was prepared by the chef.",
                            "A delightful five-course meal had been prepared by the chef.",
                            "A delightful five-course meal is prepared by the chef.",
                            "The chef was preparing a delightful five-course meal."
                        ],
                        correctOption: 0,
                        explanation: "Simple past active ('prepared') changes to 'was/were + past participle' ('was prepared') in passive voice.",
                        marks: 1
                    },
                    {
                        questionText: "Fill in the blank: 'He has lived in Patna ______ 2015.'",
                        options: ["for", "since", "from", "during"],
                        correctOption: 1,
                        explanation: "'Since' is used to denote a specific starting point in time in the past.",
                        marks: 1
                    },
                    {
                        questionText: "Choose the antonym of the word 'BENEVOLENT':",
                        options: ["Generous", "Malevolent", "Sympathetic", "Courteous"],
                        correctOption: 1,
                        explanation: "'Benevolent' means kind and well-meaning; its antonym is 'Malevolent' which means wishing evil or harm to others.",
                        marks: 1
                    }
                ]
            }
        ];

        for (const testData of sampleTests) {
            const test = new MockTest(testData);
            await test.save();
        }

        console.log(`Successfully seeded ${sampleTests.length} default mock tests across subjects!`);
    } catch (error) {
        console.error('Error seeding default mock tests:', error);
    }
};

module.exports = {
    getAllTests,
    getSubjects,
    getTestById,
    createTest,
    updateTest,
    deleteTest,
    submitTest,
    getStudentSubmissions,
    getSubmissionById,
    getTeacherTests,
    getTestSubmissionsForTeacher,
    getLeaderboard,
    seedDefaultMockTests
};

