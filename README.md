# Bitespeed-Backend-Task

Bitespeed Backend Task live on [bitespeed-i6a1.onrender.com](https://bitespeed-i6a1.onrender.com)

<br/> 
<br />


### API endpoints:
Interact with server using these endpoints.

<br />

1. **/identify**

> - Use this endpoint to fetch consolidated data for a user.
> 
> - If user is present then it'll return `consolidated data` otherwise return `user not found error`.
>
> <img src="./media/identify.png" alt="identify" width="60%"/>

<br />

2. **/adduser**

> Use this endpoint to add new user.
> 
> Creates new row in table CONTACT if user with same details is not already present.
> 
> <img src="./media/adduser.png" alt="adduser" width="60%"/>

<br/> 
<br />

### Solution:

Apart from `CONTACT` table, I've created two more tables:
1. **CONTACT_LINK** : It stores the mapping of PRIMARY link for every contact in `CONTACT` table.
2. **CONSOLIDATED_CONTACT** : It stores the mapping of the consolidated data for every PRIMARY link in `CONTACT` table.

> You can see `schemal.sql` file to see schemas for all the 3 tables.

<br />

#### Approach:

- The idea here is to first find the Id `(CONTACT.Id)` of the current user in **CONTACT** table by looking up email and phone number.
- Now search for a row in **CONTACT_LINK** table s.t. (`CONTACT.Id` == `CONTACT_LINK.secondaryContactId`). 
- This will give us the Id of the PRIMARY contact corresponding to current contact (`CONTACT_LINK.secondaryContactId`--> `CONTACT_LINK.primaryId`).
- Now search for a row in **CONSOLIDATED_CONTACT** table s.t. (`CONTACT_LINK.primaryId` == `CONSOLIDATED_CONTACT.primaryContactId`). 
- This will give us the stored consolidated JSON data for this PRIMARY contact (`CONSOLIDATED_CONTACT.primaryContactId` --> `CONSOLIDATED_CONTACT.consolidatedData`).
- Manipulate the JSON a bit and return the response.
- The current approach focuses on making search fast!

<br />

#### Example:

> <img src="./media/example.png" alt="example" width="70%"/>

<br />

### Database:

I'm using [freedb](https://freedb.tech/) for remote MySQL server.
