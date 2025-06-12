document.addEventListener("DOMContentLoaded", () => {
  // Calculator Form Inputs
  const tokenNameInput = document.getElementById("tokenName");
  const stakedTokenPriceInput = document.getElementById("stakedTokenPrice");
  const rewardTokenPriceInput = document.getElementById("rewardTokenPrice");
  const rewardTokenNameInput = document.getElementById("rewardTokenName");
  const apyInput = document.getElementById("apy");
  const budgetInput = document.getElementById("budget");
  const startDateInput = document.getElementById("startDate");
  const endDateInput = document.getElementById("endDate");
  const vaultInput = document.getElementById("vault");

  // Result Displays
  const resultValue = document.getElementById("resultValue");
  const maxStakedTokensValue = document.getElementById("maxStakedTokensValue");

  // Buttons
  const addOrUpdateProgramBtn = document.getElementById("addOrUpdateProgram");
  const clearFormBtn = document.getElementById("clearForm");
  const importJsonBtn = document.getElementById("importJson");
  const exportJsonBtn = document.getElementById("exportJson");
  const copyJsonBtn = document.getElementById("copyJson");
  const clearJsonBtn = document.getElementById("clearJson");

  // Program List & JSON I/O
  const programListDiv = document.getElementById("programList");
  const jsonImportExportTextarea = document.getElementById("jsonImportExport");

  let programs = [];
  let currentlyEditingIndex = null;

  function calculateAll() {
    const rewardsPerSecond = calculateRewardsPerSecond();
    calculateMaxStakedTokens(rewardsPerSecond);
  }

  function calculateRewardsPerSecond() {
    const stakedTokenPrice = parseFloat(stakedTokenPriceInput.value);
    const rewardTokenPrice = parseFloat(rewardTokenPriceInput.value);
    const apy = parseFloat(apyInput.value);

    if (
      isNaN(stakedTokenPrice) ||
      isNaN(rewardTokenPrice) ||
      isNaN(apy) ||
      stakedTokenPrice <= 0 ||
      rewardTokenPrice <= 0
    ) {
      resultValue.textContent = "Invalid price/APY";
      return NaN;
    }

    const yearlyRewardInUsd = stakedTokenPrice * (apy / 100);
    const yearlyRewardInTokens = yearlyRewardInUsd / rewardTokenPrice;
    const secondsInYear = 365 * 24 * 60 * 60;
    const rewardsPerSecondPerToken = yearlyRewardInTokens / secondsInYear;

    resultValue.textContent = rewardsPerSecondPerToken.toFixed(18);
    return rewardsPerSecondPerToken;
  }

  function calculateMaxStakedTokens(rewardsPerSecondPerToken) {
    if (isNaN(rewardsPerSecondPerToken) || rewardsPerSecondPerToken <= 0) {
      maxStakedTokensValue.textContent = "Needs valid rewards/sec";
      return;
    }

    const budget = parseFloat(budgetInput.value);
    const startDate = new Date(startDateInput.value);
    const endDate = new Date(endDateInput.value);

    if (
      isNaN(budget) ||
      budget <= 0 ||
      isNaN(startDate.getTime()) ||
      isNaN(endDate.getTime()) ||
      endDate <= startDate
    ) {
      maxStakedTokensValue.textContent = "Invalid budget/dates";
      return;
    }

    const durationInSeconds = (endDate.getTime() - startDate.getTime()) / 1000;
    const totalRewardsPerToken = rewardsPerSecondPerToken * durationInSeconds;
    const maxStakedTokens = budget / totalRewardsPerToken;

    maxStakedTokensValue.textContent = maxStakedTokens.toLocaleString(
      undefined,
      { maximumFractionDigits: 2 }
    );
  }

  function addOrUpdateProgram() {
    const rewardsPerSecondPerToken = calculateRewardsPerSecond();
    if (isNaN(rewardsPerSecondPerToken)) {
      alert("Please ensure all price and APY fields are valid.");
      return;
    }

    const program = {
      name: tokenNameInput.value,
      stakedTokenPrice: parseFloat(stakedTokenPriceInput.value),
      rewardTokenPrice: parseFloat(rewardTokenPriceInput.value),
      rewardTokenName: rewardTokenNameInput.value,
      apy: parseFloat(apyInput.value) / 100,
      rewardsPerSecondPerToken: rewardsPerSecondPerToken,
      budget: parseFloat(budgetInput.value),
      startTimestamp: new Date(startDateInput.value).getTime() / 1000,
      endTimestamp: new Date(endDateInput.value).getTime() / 1000,
      vault: vaultInput.value,
    };

    if (currentlyEditingIndex !== null) {
      programs[currentlyEditingIndex] = program;
    } else {
      programs.push(program);
    }

    renderProgramList();
    clearForm();
  }

  function renderProgramList() {
    programListDiv.innerHTML = programs.map((program, index) => {
      const startDate = new Date(program.startTimestamp * 1000).toLocaleDateString();
      const endDate = new Date(program.endTimestamp * 1000).toLocaleDateString();
      const apyFormatted = (program.apy * 100).toLocaleString(undefined, { maximumFractionDigits: 2 });
      const isSelected = index === currentlyEditingIndex ? 'selected' : '';

      return `
        <div class="program-item ${isSelected}" data-index="${index}">
          <div class="program-item-main">
            <span class="program-item-name">${program.name}</span>
            <span class="program-item-dates">${startDate} &ndash; ${endDate}</span>
          </div>
          <div class="program-item-side">
            <span class="program-item-apy">${apyFormatted}% APY <br><small>in ${program.rewardTokenName}</small></span>
            <button class="delete-program-btn" data-index="${index}">&times;</button>
          </div>
        </div>
      `;
    }).join('');
  }

  function deleteProgram(index) {
    if (!confirm(`Are you sure you want to delete "${programs[index].name}"?`)) {
      return;
    }
    programs.splice(index, 1);

    if (currentlyEditingIndex === index) {
      clearForm();
    } else {
      if (currentlyEditingIndex > index) {
        currentlyEditingIndex--;
      }
      renderProgramList();
    }
  }

  function selectProgramForEditing(index) {
    currentlyEditingIndex = index;
    const program = programs[index];

    tokenNameInput.value = program.name;
    stakedTokenPriceInput.value = program.stakedTokenPrice;
    rewardTokenPriceInput.value = program.rewardTokenPrice;
    rewardTokenNameInput.value = program.rewardTokenName;
    apyInput.value = (program.apy * 100).toLocaleString(undefined, {maximumFractionDigits: 10});
    budgetInput.value = program.budget;
    startDateInput.value = new Date(program.startTimestamp * 1000).toISOString().split('T')[0];
    endDateInput.value = new Date(program.endTimestamp * 1000).toISOString().split('T')[0];
    vaultInput.value = program.vault;

    addOrUpdateProgramBtn.textContent = "Update Program";
    calculateAll();
    renderProgramList();
  }

  function clearForm() {
    tokenNameInput.value = "MyRewardProgram";
    stakedTokenPriceInput.value = "100";
    rewardTokenPriceInput.value = "5";
    rewardTokenNameInput.value = "RWD";
    apyInput.value = "10";
    budgetInput.value = "1000000";
    vaultInput.value = "0x...";
    setDefaultDates();

    currentlyEditingIndex = null;
    addOrUpdateProgramBtn.textContent = "Add Program";

    calculateAll();
    renderProgramList();
  }

  function setDefaultDates() {
    const today = new Date();
    startDateInput.value = today.toISOString().split("T")[0];
    const oneWeekLater = new Date(today);
    oneWeekLater.setDate(today.getDate() + 7);
    endDateInput.value = oneWeekLater.toISOString().split("T")[0];
  }

  function exportJson() {
    jsonImportExportTextarea.value = JSON.stringify(programs, null, 2);
  }

  function copyJsonToClipboard() {
    exportJson();
    navigator.clipboard.writeText(jsonImportExportTextarea.value).then(
      () => {
        copyJsonBtn.textContent = "Copied!";
        setTimeout(() => {
          copyJsonBtn.textContent = "Copy JSON";
        }, 2000);
      },
      (err) => {
        alert("Could not copy text: ", err);
      }
    );
  }

  function importJson() {
    try {
      const importedData = JSON.parse(jsonImportExportTextarea.value);
      if (!Array.isArray(importedData)) throw new Error("JSON must be an array.");
      
      let importedCount = 0;
      let invalidCount = 0;
      importedData.forEach(p => {
        const isValid = 'name' in p && 'stakedTokenPrice' in p && 'rewardTokenPrice' in p && 
                        'rewardTokenName' in p && 'apy' in p && 'budget' in p && 'startTimestamp' in p && 
                        'endTimestamp' in p && 'vault' in p;
        if (isValid) {
          programs.push(p);
          importedCount++;
        } else {
          invalidCount++;
        }
      });

      if (invalidCount > 0) {
        alert(`Imported ${importedCount} programs. Skipped ${invalidCount} invalid entries.`);
      } else {
        alert(`${importedCount} programs imported successfully!`);
      }
      
      renderProgramList();
      jsonImportExportTextarea.value = '';
    } catch (error) {
      alert(`Error importing JSON: ${error.message}`);
    }
  }

  function setupProgramListListener() {
    programListDiv.addEventListener('click', (e) => {
      const target = e.target;
      const programItem = target.closest('.program-item');
      if (!programItem) return;

      const index = parseInt(programItem.dataset.index, 10);
      
      if (target.closest('.delete-program-btn')) {
        deleteProgram(index);
      } else {
        selectProgramForEditing(index);
      }
    });
  }

  // Event Listeners
  [
    stakedTokenPriceInput,
    rewardTokenPriceInput,
    apyInput,
    budgetInput,
    startDateInput,
    endDateInput,
  ].forEach((input) => {
    input.addEventListener("input", calculateAll);
  });
  addOrUpdateProgramBtn.addEventListener("click", addOrUpdateProgram);
  clearFormBtn.addEventListener("click", clearForm);
  importJsonBtn.addEventListener("click", importJson);
  exportJsonBtn.addEventListener("click", exportJson);
  copyJsonBtn.addEventListener("click", copyJsonToClipboard);
  clearJsonBtn.addEventListener("click", () => jsonImportExportTextarea.value = '');

  // Initial setup
  setDefaultDates();
  calculateAll();
  setupProgramListListener();
});
