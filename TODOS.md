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
- Model Transactions
- Create CRUD for Transaction
- Create Dashboard
- Integrate with Supabase
- Deploy on vercel
