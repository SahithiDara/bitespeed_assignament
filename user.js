const pool = require('./database');

module.exports.addUser = async (req, res) => {
  let userData = req.body;
  validateParams(userData);
  let userEmail = userData.email;
  let userPhone = userData.phoneNumber;
  await checkDuplicate(userEmail, userPhone);

  let emailMatchId = await getEmailMatchId(userEmail);
  let phoneMatchId = await getPhoneMatchId(userPhone);
  
  let newContactId;

  if (emailMatchId && phoneMatchId) {
    let emailPrimaryId = await getPrimaryContactId(emailMatchId);
    let phonePrimaryId = await getPrimaryContactId(phoneMatchId);
    let primaryId = Math.min(emailPrimaryId, phonePrimaryId);

    await addContact(userPhone, userEmail, primaryId, "primary");
    await updateSecondaryContacts(primaryId, phonePrimaryId, emailPrimaryId);
    await deleteContact(phonePrimaryId !== primaryId ? phonePrimaryId : emailPrimaryId);
    await updateConsolidatedContact(primaryId, phonePrimaryId, emailPrimaryId, userPhone, userEmail);

    newContactId = primaryId;
  } else if (emailMatchId || phoneMatchId) {
    let id = emailMatchId || phoneMatchId;
    let primaryId = await getPrimaryContactId(id);

    await addContact(userPhone, userEmail, primaryId, "secondary");
    await updateConsolidatedContact(primaryId, null, null, userPhone, userEmail);

    newContactId = id;
  } else {
    await pool.query(`INSERT INTO CONTACT (phoneNumber, email) VALUES ("${userPhone}","${userEmail}")`);
    let res = await pool.query(`SELECT id FROM CONTACT WHERE phoneNumber = "${userPhone}" AND email = "${userEmail}"`);
    newContactId = res[0][0].id;

    await pool.query(`INSERT INTO CONTACT_LINK (secondaryContactId, primaryContactId) VALUES (${newContactId}, ${newContactId})`);

    let json = {
      "emails": [userEmail],
      "phoneNumbers": [userPhone],
      "secondaryContactIds": []
    }
    json = JSON.stringify(json)

    await pool.query(`INSERT INTO CONSOLIDATED_CONTACT (primaryContactId, consolidatedData) VALUES (${newContactId}, '${json}')`);
  }

  return res.status(200).json({ message: "User added!", primaryContactId: newContactId });
}

module.exports.getConsolidatedContact = async (req, res) => {
  let userData = req.body;
  validateParams(userData);
  let userEmail = userData.email;
  let userPhone = userData.phoneNumber;

  var queryResponse = await pool.query(`SELECT id FROM CONTACT WHERE email = "${userEmail}" AND phoneNumber = "${userPhone}"`);
  if(!queryResponse[0].length){
    return res.status(400).json('BAD REQUEST: User not found!');
  }
  let contactId = queryResponse[0][0].id;

  queryResponse = await pool.query(`SELECT primaryContactId FROM CONTACT_LINK WHERE secondaryContactId = ${contactId}`);
  let primaryId = queryResponse[0][0].primaryContactId;

  queryResponse = await pool.query(`SELECT consolidatedData FROM CONSOLIDATED_CONTACT WHERE primaryContactId = "${primaryId}"`);
  let json = queryResponse[0][0].consolidatedData;
  json.primaryContatctId = primaryId;
  json = {contact: json};
  
  return res.status(200).json(json);
}

const validateParams = (userData) => {
  if(!userData){
    throw new Error('BAD REQUEST: Params missing!');
  }
  let userEmail = userData.email
  let userPhone = userData.phoneNumber
  if(!userEmail || !userPhone) {
    throw new Error('BAD REQUEST: Params missing!');
  }
}

const checkDuplicate =  async (userEmail, userPhone) => {
  try{
    const id = await pool.query(  `SELECT id FROM CONTACT WHERE email = "${userEmail}" AND phoneNumber = "${userPhone}"`);
    if(id[0].length > 0){
      throw new Error('User already present!');
    }
  }catch(err){
    throw new Error(err.message);
  } 
}

const getEmailMatchId = async (userEmail) => {
  var res = await pool.query(`SELECT id FROM CONTACT WHERE email = "${userEmail}"`);
  if(res[0].length > 0){
    return res[0][0].id;
  }else{
    return undefined;
  }
}

const getPhoneMatchId = async (userPhone) => {
  var res = await pool.query(`SELECT id FROM CONTACT WHERE phoneNumber = "${userPhone}"`);
  if(res[0].length > 0){
    return res[0][0].id;
  }else{
    return undefined;
  }
}

const addContact = async (userPhone, userEmail, primaryId, linkPrecedence) => {
  await pool.query(`INSERT INTO CONTACT (phoneNumber, email, linkedId, linkPrecedence) VALUES ("${userPhone}","${userEmail}", ${primaryId}, "${linkPrecedence}")`);
}

const deleteContact = async (contactId) => {
  await pool.query(`DELETE FROM CONTACT WHERE id = ${contactId}`);
}

const updateSecondaryContacts = async (primaryId, contactId1, contactId2) => {
  let newPrimaryId = primaryId === contactId1 ? contactId2 : contactId1;
  await pool.query(`UPDATE CONTACT_LINK SET primaryContactId = ${newPrimaryId} WHERE primaryContactId = ${primaryId}`);
}

const updateConsolidatedContact = async (primaryId, phonePrimaryId, emailPrimaryId, userPhone, userEmail) => {
  let queryResponse = await pool.query(`SELECT consolidatedData FROM CONSOLIDATED_CONTACT WHERE primaryContactId = ${primaryId}`);
  let json = JSON.parse(JSON.stringify(queryResponse[0][0].consolidatedData));
  
  json.phoneNumbers.push(userPhone);
  json.emails.push(userEmail);

  if (phonePrimaryId && emailPrimaryId) {
    let secondaryContactIds = json.secondaryContactIds.filter(id => id !== phonePrimaryId && id !== emailPrimaryId);
    json.secondaryContactIds = secondaryContactIds.concat([phonePrimaryId, emailPrimaryId]);
  } else if (phonePrimaryId) {
    json.secondaryContactIds.push(phonePrimaryId);
  } else if (emailPrimaryId) {
    json.secondaryContactIds.push(emailPrimaryId);
  }

  json = JSON.stringify(json);

  await pool.query(`UPDATE CONSOLIDATED_CONTACT SET consolidatedData = '${json}' WHERE primaryContactId = ${primaryId}`);
}

const getPrimaryContactId = async (contactId) => {
  let queryResponse = await pool.query(`SELECT primaryContactId FROM CONTACT_LINK WHERE secondaryContactId = ${contactId}`);
  return queryResponse[0][0].primaryContactId;
}