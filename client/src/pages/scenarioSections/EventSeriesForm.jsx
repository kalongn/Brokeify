import React from "react";
import { useNavigate } from "react-router-dom";

const EventSeriesForm = () => {
  const navigate = useNavigate();
    const handleClick = () => {
        navigate("/ScenarioForm/event-series");
    };
    return (
        <div>
            <h2>New Event Series</h2>
            <form>
                <label>
                    Event Series Name
                    <input type="text" name="event-series-name" required/>
                </label>
                <label>
                    Description
                    <input type="text" name="description" />
                </label>
            </form>
            <div style={{ marginTop: "20px" }}>
              <button
                  onClick={handleClick}
                  style={{ marginRight: "10px" }}
              >
                  Cancel
              </button>
              <button
                  onClick={handleClick}
              >
                  Create
              </button>
          </div>
        </div>
    );
};

export default EventSeriesForm;