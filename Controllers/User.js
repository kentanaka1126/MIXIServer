const UserModel = require("../Models/UserModel.js");
module.exports.update = (req, res) => {
  UserModel.findByIdAndUpdate(req.body._id, req.body, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else res.status(200).json(req.body);
  });
};

module.exports.get = (req, res) => {
  const { index, limit } = req.body;
  const start=Number(index) * Number(limit);
  UserModel.find({})
    .sort({email:-1})
    .then((data) => {
      res.status(200).json({users:data.slice(start,start+limit),total:data.length});
    })
    .catch((err) => res.status(500).send(err));
};
