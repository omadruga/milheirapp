export default function (type: String) {
  switch (type) {
    case "BUY":
      return "Compra de Milhas";
    case "MEMBERSHIP":
      return "Assinatura de Clube";
    case "PARTNER":
      return "Acúmulo via Parceiro";
    case "FLIGHT_REWARD":
      return "Acúmulo por Voar";
    case "TRANSFER":
      return "Transferência";
    case "TRANSFER_BUY":
      return "Transferência com Compra";
    case "FLIGHT":
      return "Emissão de Passagem";
    case "EXPIRE":
      return "Milhas Expiradas";
  }
}
