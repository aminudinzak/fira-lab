import "./style.css";
import Alpine from "alpinejs";

window.Alpine = Alpine;

window.filtrationLab = function () {
  return {
    selectedWater: "rainwater",

    isRunning: false,
    showHistoryModal: false,
    showGuideModal: false,
    showDeveloperModal: false,
    showWelcomeModal: true,

    sourceTankLevel: 72,
    resultTankLevel: 0,
    hasResult: false,

    trialNumber: 1,
    trials: [],

    waterTypes: {
      rainwater: {
        name: "Air Hujan",
        sourceNote: "Preset air hujan panen dengan turbidity rendah.",
        initialTurbidity: 10,
        initialPollutant: 20,
      },
      river: {
        name: "Air Sungai",
        sourceNote: "Preset air sungai dengan kekeruhan dan partikel tinggi.",
        initialTurbidity: 120,
        initialPollutant: 80,
      },
      lake: {
        name: "Air Danau",
        sourceNote: "Preset air danau dengan kekeruhan sedang.",
        initialTurbidity: 55,
        initialPollutant: 40,
      },
    },

    filterLayers: {
      gravel: {
        name: "Kerikil",
        thickness: 4,
        maxThickness: 12,
        turbidityRemoval: 0.22,
        pollutantRemoval: 0.12,
        color: "bg-stone-400",
        description: "Menahan partikel besar dan membantu distribusi aliran air.",
      },
      silicaSand: {
        name: "Pasir Silika",
        thickness: 4,
        maxThickness: 12,
        turbidityRemoval: 0.48,
        pollutantRemoval: 0.34,
        color: "bg-yellow-300",
        description: "Menyaring partikel halus dan menurunkan turbidity.",
      },
      zeolite: {
        name: "Batu Zeolit",
        thickness: 4,
        maxThickness: 12,
        turbidityRemoval: 0.38,
        pollutantRemoval: 0.42,
        color: "bg-emerald-300",
        description: "Material berpori yang membantu menahan partikel dan sebagian ion.",
      },
      activatedCarbon: {
        name: "Arang Aktif",
        thickness: 4,
        maxThickness: 12,
        turbidityRemoval: 0.35,
        pollutantRemoval: 0.58,
        color: "bg-neutral-800",
        description: "Berpori tinggi, baik untuk menurunkan warna dan sebagian kontaminan.",
      },
      cotton: {
        name: "Kapas",
        thickness: 4,
        maxThickness: 12,
        turbidityRemoval: 0.52,
        pollutantRemoval: 0.38,
        color: "bg-slate-100",
        description: "Serat rapat untuk menahan partikel halus.",
      },
    },

    finalTurbidity: 10,
    finalPollutant: 20,

    init() {
      this.applyWaterPreset();
    },

    get activeWater() {
      return this.waterTypes[this.selectedWater];
    },

    get initialTurbidity() {
      return this.activeWater.initialTurbidity;
    },

    get initialPollutant() {
      return this.activeWater.initialPollutant;
    },

    get layersArray() {
      return Object.entries(this.filterLayers).map(([key, layer]) => ({
        key,
        ...layer,
      }));
    },

    get visibleLayers() {
      return this.layersArray.filter((layer) => {
        return Number(this.filterLayers[layer.key].thickness) > 0;
      });
    },

    get totalThickness() {
      return this.layersArray.reduce((sum, layer) => {
        return sum + Number(layer.thickness);
      }, 0);
    },

    get turbidityReduction() {
      if (this.initialTurbidity === 0) return 0;

      return (
        ((this.initialTurbidity - this.finalTurbidity) /
          this.initialTurbidity) *
        100
      );
    },

    get pollutantReduction() {
      if (this.initialPollutant === 0) return 0;

      return (
        ((this.initialPollutant - this.finalPollutant) /
          this.initialPollutant) *
        100
      );
    },

    get waterQualityLabel() {
      if (this.finalTurbidity <= 5 && this.finalPollutant <= 20) {
        return "sangat jernih";
      }

      if (this.finalTurbidity <= 25 && this.finalPollutant <= 35) {
        return "cukup jernih";
      }

      if (this.finalTurbidity <= 55 && this.finalPollutant <= 50) {
        return "agak keruh";
      }

      return "masih keruh";
    },

    get resultWaterColor() {
      const turbidity = this.finalTurbidity;

      if (turbidity <= 5) return "rgba(125, 211, 252, 0.65)";
      if (turbidity <= 25) return "rgba(56, 189, 248, 0.55)";
      if (turbidity <= 55) return "rgba(147, 197, 253, 0.45)";
      if (turbidity <= 120) return "rgba(180, 83, 9, 0.45)";
      return "rgba(120, 53, 15, 0.6)";
    },

    get initialWaterColor() {
      const turbidity = this.initialTurbidity;

      if (turbidity <= 5) return "rgba(125, 211, 252, 0.65)";
      if (turbidity <= 25) return "rgba(56, 189, 248, 0.55)";
      if (turbidity <= 55) return "rgba(147, 197, 253, 0.45)";
      if (turbidity <= 120) return "rgba(180, 83, 9, 0.45)";
      return "rgba(120, 53, 15, 0.6)";
    },

    applyWaterPreset() {
      this.finalTurbidity = this.initialTurbidity;
      this.finalPollutant = this.initialPollutant;

      this.sourceTankLevel = 72;
      this.resultTankLevel = 0;
      this.hasResult = false;
    },

    getLayerFactor(thickness, maxThickness) {
      if (thickness <= 0) return 0;

      const normalizedThickness = thickness / maxThickness;

      return 1 - Math.exp(-2.2 * normalizedThickness);
    },

    calculateFinalValues() {
      let turbidity = this.initialTurbidity;
      let pollutant = this.initialPollutant;

      this.layersArray.forEach((layer) => {
        const layerFactor = this.getLayerFactor(
          Number(layer.thickness),
          Number(layer.maxThickness)
        );

        const turbidityRemoval = layer.turbidityRemoval * layerFactor;
        const pollutantRemoval = layer.pollutantRemoval * layerFactor;

        turbidity = turbidity * (1 - turbidityRemoval);
        pollutant = pollutant * (1 - pollutantRemoval);
      });

      return {
        turbidity: Math.max(0.5, turbidity),
        pollutant: Math.max(0, pollutant),
      };
    },

    startSimulation() {
      if (this.isRunning) return;

      this.isRunning = true;
      this.hasResult = false;

      this.finalTurbidity = this.initialTurbidity;
      this.finalPollutant = this.initialPollutant;

      this.sourceTankLevel = 72;
      this.resultTankLevel = 0;

      setTimeout(() => {
        this.sourceTankLevel = 14;
        this.resultTankLevel = 70;
      }, 80);

      setTimeout(() => {
        const result = this.calculateFinalValues();

        this.finalTurbidity = Number(result.turbidity.toFixed(1));
        this.finalPollutant = Number(result.pollutant.toFixed(1));

        this.hasResult = true;
        this.isRunning = false;

        this.trials.unshift({
          id: this.trialNumber,
          water: this.activeWater.name,
          totalThickness: this.totalThickness,
          finalTurbidity: this.finalTurbidity,
          finalPollutant: this.finalPollutant,
          turbidityReduction: Number(this.turbidityReduction.toFixed(1)),
          pollutantReduction: Number(this.pollutantReduction.toFixed(1)),
          gravel: this.filterLayers.gravel.thickness,
          silicaSand: this.filterLayers.silicaSand.thickness,
          zeolite: this.filterLayers.zeolite.thickness,
          activatedCarbon: this.filterLayers.activatedCarbon.thickness,
          cotton: this.filterLayers.cotton.thickness,
        });

        this.trialNumber += 1;

        if (this.trials.length > 6) {
          this.trials.pop();
        }
      }, 1800);
    },

    resetSimulation() {
      this.selectedWater = "rainwater";

      this.filterLayers.gravel.thickness = 4;
      this.filterLayers.silicaSand.thickness = 4;
      this.filterLayers.zeolite.thickness = 4;
      this.filterLayers.activatedCarbon.thickness = 4;
      this.filterLayers.cotton.thickness = 4;

      this.isRunning = false;
      this.showHistoryModal = false;
      this.showGuideModal = false;
      this.showDeveloperModal = false;

      this.applyWaterPreset();
    },

    clearHistory() {
      this.trials = [];
      this.trialNumber = 1;
    },
  };
};

Alpine.start();