class CryptoPortfolio {
  constructor() {
    this.balance = 1000;
    this.maxBalance = this.balance;
    this.minBalance = this.balance;

    this.cryptoList = ["BTC", "ETH", "BNB", "SOL", "USDT", "DOGE", "LTC", "MATIC"];
    this.fullNames = {
      BTC: "Bitcoin", ETH: "Ethereum", BNB: "Binance Coin", SOL: "Solana",
      USDT: "Tether", DOGE: "Dogecoin", LTC: "Litecoin", MATIC: "Polygon"
    };

    this.holdings = {};
    this.prices = {};
    this.oldPrices = {};
    this.oldColors = {};
    this.inputVisible = {};

    for (let sym of this.cryptoList) {
      this.holdings[sym] = 0;
      this.prices[sym] = null;
      this.oldPrices[sym] = null;
      this.oldColors[sym] = "price-neutral";
      this.inputVisible[sym] = null;
    }

    this.balanceElem = document.getElementById("balance");
    this.maxBalanceElem = document.getElementById("maxBalanceHistory");
    this.cryptoSectionsElem = document.getElementById("cryptoSections");
    this.totalCryptoElem = document.getElementById("totalCrypto");
    this.currentTotalElem = document.getElementById("currentTotal");
    this.resetBtn = document.getElementById("resetBtn");

    this.resetBtn.onclick = () => this.resetPortfolio();

    this.loadPortfolio();
    this.refreshPrices().then(() => this.updateDisplay());
    setInterval(() => this.refreshPrices().then(() => this.updateDisplay()), 20000);
  }

  loadPortfolio() {
    const savedBalance = localStorage.getItem("balance");
    const savedHoldings = localStorage.getItem("holdings");
    const savedMax = localStorage.getItem("maxBalance");
    const savedMin = localStorage.getItem("minBalance");

    if (savedBalance !== null) this.balance = parseFloat(savedBalance);
    if (savedHoldings !== null) this.holdings = JSON.parse(savedHoldings);
    if (savedMax !== null) this.maxBalance = parseFloat(savedMax);
    if (savedMin !== null) this.minBalance = parseFloat(savedMin);
  }

  savePortfolio() {
    localStorage.setItem("balance", this.balance);
    localStorage.setItem("holdings", JSON.stringify(this.holdings));
    localStorage.setItem("maxBalance", this.maxBalance);
    localStorage.setItem("minBalance", this.minBalance);
  }

  resetPortfolio() {
    if (confirm("Voulez-vous réinitialiser votre portefeuille ?")) {
      this.balance = 1000;
      this.maxBalance = this.balance;
      this.minBalance = this.balance;
      for (let sym of this.cryptoList) this.holdings[sym] = 0;
      this.savePortfolio();
      this.updateDisplay();
    }
  }

  refreshPrices() {
    const ids = {
      BTC: "bitcoin", ETH: "ethereum", BNB: "binancecoin", SOL: "solana",
      USDT: "tether", DOGE: "dogecoin", LTC: "litecoin", MATIC: "matic-network"
    };

    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${Object.values(ids).join(",")}&vs_currencies=eur`;

    return fetch(url)
      .then(res => res.json())
      .then(data => {
        for (let sym of this.cryptoList) {
          this.oldPrices[sym] = this.prices[sym];
          if (data[ids[sym]] && data[ids[sym]].eur !== undefined) {
            this.prices[sym] = data[ids[sym]].eur;
          } else {
            this.prices[sym] = null;
          }
        }
      })
      .catch(err => {
        console.error("Erreur API CoinGecko :", err);
        for (let sym of this.cryptoList) this.prices[sym] = null;
      });
  }

  updateDisplay() {
    this.savePortfolio();
    this.balanceElem.textContent = `Votre solde : ${this.balance.toFixed(2)} €`;
    this.cryptoSectionsElem.innerHTML = "";

    let totalCryptoValue = 0;

    this.cryptoList.forEach(sym => {
      const section = document.createElement("div");
      section.className = "crypto-section";

      const nameElem = document.createElement("h3");
      nameElem.textContent = `${this.fullNames[sym]} (${sym})`;
      section.appendChild(nameElem);

      const priceElem = document.createElement("p");

      if (this.prices[sym] === null) {
        priceElem.textContent = "Prix en attente...";
        priceElem.className = this.oldColors[sym] || "price-neutral";
      } else if (this.oldPrices[sym] === null || this.prices[sym] === this.oldPrices[sym]) {
        priceElem.textContent = `Prix : ${this.prices[sym].toFixed(2)} €`;
        priceElem.className = this.oldColors[sym] || "price-neutral";
      } else if (this.prices[sym] > this.oldPrices[sym]) {
        priceElem.textContent = `Prix : ${this.prices[sym].toFixed(2)} €`;
        priceElem.className = "price-up";
      } else {
        priceElem.textContent = `Prix : ${this.prices[sym].toFixed(2)} €`;
        priceElem.className = "price-down";
      }

      this.oldColors[sym] = priceElem.className;
      section.appendChild(priceElem);

      if (this.holdings[sym] > 0 && this.prices[sym] !== null) {
        const holdingElem = document.createElement("p");
        const value = this.holdings[sym] * this.prices[sym];
        totalCryptoValue += value;
        holdingElem.textContent = `Vous possédez ${this.holdings[sym].toFixed(5)} ${sym} (≈ ${value.toFixed(2)} €)`;
        section.appendChild(holdingElem);
      }

      const buyBtn = document.createElement("button");
      buyBtn.textContent = "Acheter";
      buyBtn.onclick = () => this.toggleInput(sym, "buy");
      section.appendChild(buyBtn);

      const sellBtn = document.createElement("button");
      sellBtn.textContent = "Vendre";
      sellBtn.disabled = this.holdings[sym] === 0;
      sellBtn.onclick = () => this.toggleInput(sym, "sell");
      section.appendChild(sellBtn);

      const inputDiv = document.createElement("div");
      inputDiv.className = "crypto-input";
      inputDiv.id = `input-${sym}`;
      section.appendChild(inputDiv);

      this.cryptoSectionsElem.appendChild(section);
    });

    this.totalCryptoElem.textContent = `Total crypto détenu : ${totalCryptoValue.toFixed(2)} €`;
    const totalPortfolio = totalCryptoValue + this.balance;
    this.currentTotalElem.textContent = `Total actuel : ${totalPortfolio.toFixed(2)} €`;

    if (totalPortfolio > this.maxBalance) this.maxBalance = totalPortfolio;
    if (totalPortfolio < this.minBalance) this.minBalance = totalPortfolio;
    this.maxBalanceElem.textContent = `Solde max : ${this.maxBalance.toFixed(2)} €`;
  }

  toggleInput(sym, action) {
    const inputZone = document.getElementById(`input-${sym}`);
    if (this.inputVisible[sym] === action) {
      inputZone.innerHTML = "";
      this.inputVisible[sym] = null;
      return;
    }

    this.inputVisible[sym] = action;
    inputZone.innerHTML = "";

    const selectType = document.createElement("select");
    selectType.append(new Option("Montant en €", "eur"), new Option(`Montant en ${sym}`, "crypto"));

    const input = document.createElement("input");
    input.type = "number";
    input.placeholder = "Montant";

    selectType.onchange = () => {
      input.placeholder = selectType.value === "eur" ? "Montant en €" : `Montant en ${sym}`;
    };

    const confirmBtn = document.createElement("button");
    confirmBtn.textContent = "Valider";
    confirmBtn.onclick = () => this.executeTransaction(sym, action, parseFloat(input.value), selectType.value, inputZone);

    inputZone.append(selectType, input, confirmBtn);
  }

  executeTransaction(sym, action, amount, type, inputZone) {
    if (isNaN(amount) || amount <= 0) {
      alert("Veuillez entrer un montant valide.");
      return;
    }
    if (this.prices[sym] === null || this.prices[sym] <= 0) {
      alert(`Le prix de ${sym} n'est pas disponible pour le moment.`);
      return;
    }

    if (action === "buy") {
      if (type === "eur") {
        const cryptoToBuy = amount / this.prices[sym];
        if (amount <= this.balance) {
          this.holdings[sym] += cryptoToBuy;
          this.balance -= amount;
        } else { alert("Solde insuffisant !"); return; }
      } else {
        const valueInEuro = amount * this.prices[sym];
        if (valueInEuro <= this.balance) {
          this.holdings[sym] += amount;
          this.balance -= valueInEuro;
        } else { alert("Solde insuffisant !"); return; }
      }
    } else if (action === "sell") {
      if (type === "eur") {
        const cryptoToSell = amount / this.prices[sym];
        if (cryptoToSell <= this.holdings[sym]) {
          this.holdings[sym] -= cryptoToSell;
          this.balance += amount;
        } else { alert("Crypto insuffisante !"); return; }
      } else {
        if (amount <= this.holdings[sym]) {
          this.holdings[sym] -= amount;
          this.balance += amount * this.prices[sym];
        } else { alert("Crypto insuffisante !"); return; }
      }
    }

    inputZone.innerHTML = "";
    this.inputVisible[sym] = null;
    this.updateDisplay();
  }
}

const portfolio = new CryptoPortfolio();
