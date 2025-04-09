import UserController from '../db/controllers/UserController.js';

const userController = new UserController();

const stateMap = {
    "AL": "Alabama",
    "AK": "Alaska",
    "AZ": "Arizona",
    "AR": "Arkansas",
    "CA": "California",
    "CO": "Colorado",
    "CT": "Connecticut",
    "DE": "Delaware",
    "FL": "Florida",
    "GA": "Georgia",
    "HI": "Hawaii",
    "ID": "Idaho",
    "IL": "Illinois",
    "IN": "Indiana",
    "IA": "Iowa",
    "KS": "Kansas",
    "KY": "Kentucky",
    "LA": "Louisiana",
    "ME": "Maine",
    "MD": "Maryland",
    "MA": "Massachusetts",
    "MI": "Michigan",
    "MN": "Minnesota",
    "MS": "Mississippi",
    "MO": "Missouri",
    "MT": "Montana",
    "NE": "Nebraska",
    "NV": "Nevada",
    "NH": "New Hampshire",
    "NJ": "New Jersey",
    "NM": "New Mexico",
    "NY": "New York",
    "NC": "North Carolina",
    "ND": "North Dakota",
    "OH": "Ohio",
    "OK": "Oklahoma",
    "OR": "Oregon",
    "PA": "Pennsylvania",
    "RI": "Rhode Island",
    "SC": "South Carolina",
    "SD": "South Dakota",
    "TN": "Tennessee",
    "TX": "Texas",
    "UT": "Utah",
    "VT": "Vermont",
    "VA": "Virginia",
    "WA": "Washington",
    "WV": "West Virginia",
    "WI": "Wisconsin",
    "WY": "Wyoming"
};

const stateAbbreviationToString = (stateAbbreviation) => {
    if (stateAbbreviation) {
        return stateMap[stateAbbreviation] || stateAbbreviation;
    }
    return null;
}

const distributionToString = (distribution) => {
    if (!distribution) {
        return null;
    }
    if (distribution.distributionType) { // This is for distribution directly from the database
        switch (distribution.distributionType) {
            case "FIXED_AMOUNT":
                return `Fixed ${distribution.value}`;
            case "FIXED_PERCENTAGE":
                return `Fixed ${distribution.value * 100}%`;
            case "UNIFORM_AMOUNT":
                return `Uniform ${distribution.lowerBound} to ${distribution.upperBound}`;
            case "UNIFORM_PERCENTAGE":
                return `Uniform ${distribution.lowerBound * 100}% to ${distribution.upperBound * 100}%`;
            case "NORMAL_AMOUNT":
                return `Normal ${distribution.mean} ± ${distribution.standardDeviation}`;
            case "NORMAL_PERCENTAGE":
                return `Normal ${distribution.mean * 100}% ± ${distribution.standardDeviation * 100}%`;
            default:
                return null;
        }
    }
    return null;
}



const distributionToFrontend = (distribution) => {
    if (!distribution) {
        return null;
    }
    switch (distribution.distributionType) {
        case "FIXED_AMOUNT":
            return { type: "fixed", value: distribution.value };
        case "UNIFORM_AMOUNT":
            return { type: "uniform", lowerBound: distribution.lowerBound, upperBound: distribution.upperBound };
        case "NORMAL_AMOUNT":
            return { type: "normal", mean: distribution.mean, standardDeviation: distribution.standardDeviation };
        case "FIXED_PERCENTAGE":
            return { type: "fixed", value: distribution.value * 100, isPercentage: true };
        case "UNIFORM_PERCENTAGE":
            return { type: "uniform", lowerBound: distribution.lowerBound * 100, upperBound: distribution.upperBound * 100, isPercentage: true };
        case "NORMAL_PERCENTAGE":
            return { type: "normal", mean: distribution.mean * 100, standardDeviation: distribution.standardDeviation * 100, isPercentage: true };
        default:
            return null;
    }
}

const distributionToBackend = (distribution) => {
    if (!distribution) {
        return null;
    }
    const { type, ...data } = distribution;
    let distributionType = null;
    switch (type) {
        case "fixed":
            distributionType = data.isPercentage ? "FIXED_PERCENTAGE" : "FIXED_AMOUNT";
            data.value = data.isPercentage ? data.value / 100 : data.value;
            break;
        case "uniform":
            distributionType = data.isPercentage ? "UNIFORM_PERCENTAGE" : "UNIFORM_AMOUNT";
            data.lowerBound = data.isPercentage ? data.lowerBound / 100 : data.lowerBound;
            data.upperBound = data.isPercentage ? data.upperBound / 100 : data.upperBound;
            break;
        case "normal":
            distributionType = data.isPercentage ? "NORMAL_PERCENTAGE" : "NORMAL_AMOUNT";
            data.mean = data.isPercentage ? data.mean / 100 : data.mean;
            data.standardDeviation = data.isPercentage ? data.standardDeviation / 100 : data.standardDeviation;
            break;
        default:
            return null;
    }
    delete data.isPercentage;
    return { distributionType, ...data };
}

const taxStatusToFrontend = (taxStatus) => {
    switch (taxStatus) {
        case "CASH":
            return "Cash";
        case "NON_RETIREMENT":
            return "Non-Retirement";
        case "PRE_TAX_RETIREMENT":
            return "Pre-Tax Retirement";
        case "AFTER_TAX_RETIREMENT":
            return "After-Tax Retirement";
        default:
            return null;
    }
}
const taxStatusToBackend = (taxStatus) => {
    switch (taxStatus) {
        case "Cash":
            return "CASH";
        case "Non-Retirement":
            return "NON_RETIREMENT";
        case "Pre-Tax Retirement":
            return "PRE_TAX_RETIREMENT";
        case "After-Tax Retirement":
            return "AFTER_TAX_RETIREMENT";
        default:
            return null;
    }
}

const allocateMethodToFrontend = (allocationMethod) => {
    switch (allocationMethod) {
        case "FIXED":
            return "fixed";
        case "GLIDE":
            return "glidePath";
        default:
            return null;
    }
}

const allocateMethodToBackend = (allocationMethod) => {
    switch (allocationMethod) {
        case "fixed":
            return "FIXED";
        case "glidePath":
            return "GLIDE";
        default:
            return null;
    }
}

const isOwner = async (userId, scenarioId) => {
    const user = await userController.read(userId);
    return user.ownerScenarios.some(scenario => scenario._id.toString() === scenarioId);
}

const canEdit = async (userId, scenarioId) => {
    const user = await userController.read(userId);
    return user.ownerScenarios.some(scenario => scenario._id.toString() === scenarioId) ||
        user.editorScenarios.some(scenario => scenario._id.toString() === scenarioId);
}

const canView = async (userId, scenarioId) => {
    const user = await userController.read(userId);
    return user.ownerScenarios.some(scenario => scenario._id.toString() === scenarioId) ||
        user.editorScenarios.some(scenario => scenario._id.toString() === scenarioId) ||
        user.viewerScenarios.some(scenario => scenario._id.toString() === scenarioId);
}

export {
    distributionToFrontend,
    distributionToBackend,
    distributionToString,
    stateAbbreviationToString,
    taxStatusToFrontend,
    taxStatusToBackend,
    allocateMethodToFrontend,
    allocateMethodToBackend,
    isOwner,
    canEdit,
    canView
}