
// Simple role-based authorization middleware
module.exports = function(roles) {
    // Convert single role to array for consistent handling
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    return (req, res, next) => {
        // Since we run authenticateToken first, req.user must be populated
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Access Denied: Not Authenticated' 
            });
        }

        // Check if user has required role
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: `Access Forbidden: Role '${req.user.role}' is not authorized` 
            });
        }
        
        next();
    };
};
