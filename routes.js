const express = require("express")
const router = express.Router();
const user = require('./user');

router
  .route('/identify')
  .post(user.getConsolidatedContact)

router
  .route('/adduser')
  .post(user.addUser)

module.exports = router;