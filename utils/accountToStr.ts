export default function (account: any) {
  if (!account) {
    return null;
  }
  return (
    account.company.name +
    " - " +
    account.cpf.name +
    " (" +
    account.cpf.cpf +
    ")"
  );
}
