import React from "react";
import { useNavigate } from "react-router-dom";

const EventSeries = () => {
    const navigate = useNavigate();
    const newEventSeries = () => {
      navigate("/ScenarioForm/event-series/new");
    }
    return (
        <div>
            <h2>Event Series</h2>
            <p>
              An event series is a sequence of recurring financial events 
              (income, expense, investment, or rebalancing) over a defined period. 
              Only one asset allocation can be rebalanced in a scenario.
            </p>
            <form>
                <label>
                    Event Series Name
                    <input type="text" name="event" />
                </label>
                {/* Type button prevents form submission on click */}
                <button type="button" onClick={newEventSeries}>
                    Add Event Series
                </button>
            </form>
        </div>
    );
};

export default EventSeries;