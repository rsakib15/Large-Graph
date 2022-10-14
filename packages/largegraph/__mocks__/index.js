/* eslint-disable no-unused-vars */
/* eslint-disable standard/object-curly-even-spacing */
const Mock = require('mockjs');

module.exports = {
  'POST /index.php/node': function (req, res) {
    res.send({
      state: 1,
      msg: 'success',
      data: req.body,

    })
  }
};
