import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const EventSeries = () => {
    const navigate = useNavigate();
    const newEventSeries = () => {
      navigate("/ScenarioForm/event-series/new");
    }
    // TODO: remove cash from initial state when done testing
    const [events, setEvents] = useState([
        { name: "Cash", type: "Expense" },
    ]);
    const handleInputChange = (index, field, value) => {
        const updatedEvents = [...events];
        updatedEvents[index][field] = value;
        setEvents(updatedEvents);
    };

    const addNewEvent = () => {
        setInvestments([...events, { name: "", type: "" }]);
    };
    return (
        <div>
            <h2>Event Series</h2>
            <p>
              An event series is a sequence of recurring financial events 
              (income, expense, investment, or rebalancing) over a defined period. 
              Only one asset allocation can be rebalanced in a scenario.
            </p>
            {/* TODO: fix global table styling */}
            <table>
                <thead>
                    <tr>
                        <th>Event Series Name</th>
                        <th>Type</th>
                    </tr>
                </thead>
                <tbody>
                {events.map((event, index) => (
                        <tr key={index}>
                            <td>
                                <input
                                type="text"
                                value={event.name}
                                onChange={(e) =>
                                    handleInputChange(index, "name", e.target.value)
                                }
                                placeholder={event.name}
                                />
                            </td>
                            <td>
                                <input
                                type="text"
                                value={event.type}
                                disabled
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <button onClick={newEventSeries}>
                Add New Event Series
            </button>
        </div>
    );
};

export default EventSeries;