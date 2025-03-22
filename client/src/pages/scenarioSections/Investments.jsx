import { useState } from "react";
import Select from "react-select";

const Investments = () => {
    // TODO: replace with investments from db
    const [investments, setInvestments] = useState([
        { type: "Cash", value: "", taxStatus: "" },
    ]);

    // TODO: replace all options except for Cash with user-defined ones
    const investmentTypes = [
        { value: "Cash", label: "Cash" },
        { value: "Stocks", label: "Stocks" },
        { value: "Bonds", label: "Bonds" },
        { value: "Real Estate", label: "Real Estate" },
        { value: "Mutual Funds", label: "Mutual Funds" },
    ];
    const taxStatuses = [
        { value: "Non-Retirement", label: "Non-Retirement" },
        { value: "Pre-Tax Retirement", label: "Pre-Tax Retirement" },
        { value: "After-Tax Retirement", label: "After-Tax Retirement" },
    ];

    const handleInputChange = (index, field, value) => {
        const updatedInvestments = [...investments];
        updatedInvestments[index][field] = value;
        setInvestments(updatedInvestments);
    };

    const addNewInvestment = () => {
        setInvestments([...investments, { type: "", value: "", taxStatus: "" }]);
    };

    return (
        <div>
            <h2>Investments</h2>
            <p>
                If married, investments will automatically be assumed as jointly owned.
            </p>

            <table>
                <thead>
                    <tr>
                        <th>Investment Type</th>
                        <th>Dollar Value</th>
                        <th>Tax Status</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Dynamically render rows of investments */}
                    {investments.map((investment, index) => (
                        <tr key={index}>
                            <td>
                                <Select 
                                options={investmentTypes}
                                value={investmentTypes.find((option) => option.value === investments[index].type)}
                                onChange={(e) =>
                                    handleInputChange(index, "type", e.value)
                                }
                                />
                            </td>
                            <td>
                                <input
                                type="number"
                                value={investment.value}
                                onChange={(e) =>
                                    handleInputChange(index, "value", e.target.value)
                                }
                                placeholder="$"
                                />
                            </td>
                            <td>
                                <Select 
                                options={taxStatuses}
                                value={investmentTypes.find((option) => option.value === investments[index].type)}
                                onChange={(e) =>
                                    handleInputChange(index, "type", e.value)
                                }
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <button type="button" onClick={addNewInvestment}>
                Add New Investment
            </button>
        </div>
    );
};

export default Investments;