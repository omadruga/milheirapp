Project Overview

- Person as a User
- Each User can hold numerous CPFs
- Each CPFs can hold numerous Account
- Each Account can hold numerous Transactions

- CPF model holds data related to the CPF used on all miles programs (banks, rewards, airlines) and belongs to User
- Account model holds data related to the account on the miles programs (banks, rewars, airlines) and belongs to CPF
- Transaction model hols data related to each transaction (miles reward, miles issued, miles bought, etc) and belongs to MilesAccount

- User can regisster his CPFs, his Accounts for each CPF, his Transactions for each Account
- System calculates the average mile price in each Account
- System calculates the used CPF on each Airline Account to track available CPFs to issue flights
- System notifies User about free slots available basead on rules of each Airline
- System can simulate transactions, to be able to calculate new prices and miles

TODOs

- [done] Add a ORM support
- [done] Model CPF
- [done] Create CRUD for CPF
- [done] Model Account
- [done] Create CRUD for Account
- [done] Model Company
- [done] Create CRUD for Company
- [done] Model Transactions
- [done] Create CRUD for Transaction
- [done] Create proper header
- [done] Create Dashboard
- [done] Deploy on vercel
- Better error handling,
- Integrate with Supabase or Add Auth manually
- Model User/Role
- Role Guest, User, Admin
- Restrict pages based on role
- Create Auth for User
- Create Profile for User
- SEO Thing
- CPF couting
- Nearest expire
- Email when Latam CPFs free (daily cron job at 7 am)

ENHANCEMENTs

- [done] thousand point on numbers
- [done] currency on money numbers
- icons on dashboard
- order selects
- order dashboard
- [done] filter transaction
- [done] make form a component
- filter account selection on transactions
  -- flight can only be selected for airline
  -- transfer can only target same cpf account
- make the code more readable (use more types)
- make some unit tests
- make some integration tests
- make some e2e tests
- push to github
- use zod for validation
- search account as component
