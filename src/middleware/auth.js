const jwt = require('jsonwebtoken');
module.exports = function(req,res,next){
  const h = req.headers.authorization;
  if (!h) return res.status(401).send('no auth');
  const token = h.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch(e) { return res.status(401).send('invalid'); }
};
