import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import styles from "./Form.module.css";

const EventSeriesForm = () => {
    const [startYear, setStartYear] = useState("");
    const [duration, setDuration] = useState("");

    // TODO: replace all options with user-defined ones
    const events = [
        { value: "event1", label: "Event 1" },
        { value: "event2", label: "Event 2" },
        { value: "event3", label: "Event 3" },
    ];
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
                    <input type="text" name="event-series-name" className={styles.newline} />
                </label>
                <label>
                    Description
                    <input type="text" name="description" className={styles.newline} />
                </label>
                <label>
                    Start Year
                </label>
                <div>
                <label className={styles.newline}>
                    <input 
                    type="radio" 
                    name="start-year" 
                    value="fixed" 
                    onChange={(e) => setStartYear(e.target.value)}
                    />
                    Fixed Value
                </label>
                <label className={styles.newline}>
                    <input 
                    type="radio" 
                    name="start-year" 
                    value="uniform-dist" 
                    onChange={(e) => setStartYear(e.target.value)}
                    />
                    Sample from Uniform Distribution
                </label>
                <label>
                    <input 
                    type="radio" 
                    name="start-year" 
                    value="normal-dist" 
                    onChange={(e) => setStartYear(e.target.value)}
                    />
                    Sample from Normal Distribution
                </label>
                </div>
                <div>
                <label className={styles.newline}>
                    <input 
                    type="radio" 
                    name="start-year" 
                    value="event-start" 
                    onChange={(e) => setStartYear(e.target.value)}
                    />
                    Same Year that Specified Event Starts
                </label>
                <label>
                    <input 
                    type="radio" 
                    name="start-year" 
                    value="event-end" 
                    onChange={(e) => setStartYear(e.target.value)}
                    />
                    Year After Specified Event End
                </label>
                </div>

                {startYear === "fixed" && (
                    <label className={styles.newline}>
                        Fixed Value
                        <input type="number" name="fixed-value" className={styles.newline} min="1" />
                    </label>
                )}
                {startYear === "normal-dist" && (
                    <>
                    <label className={styles.newline}>
                        Mean
                        <input type="number" name="mean" min="1" />
                        Standard Deviation
                        <input type="number" name="std-dev" min="0" />
                    </label>
                    <label>
                        Calculated Life Expectancy
                        <input type="number" name="calculated-year" className={styles.newline} disabled />
                    </label>
                    </>
                )}
                {startYear === "uniform-dist" && (
                    <>
                    <label className={styles.newline}>
                        Lower Bound
                        <input type="number" name="lower-bound" min="0" />
                        Upper Bound
                        <input type="number" name="upper-bound" min="0" />
                    </label>
                    <label>
                        Calculated Year
                        <input type="number" name="calculated-year" className={styles.newline} disabled />
                    </label>
                    </>
                )}
                {/* For event start and event end */}
                {startYear.includes("event") && (
                    <label className={styles.newline}>
                        Specified Event
                        <Select options={events} />
                    </label>
                )}

                <label>
                    Duration (in years)
                </label>
                <label className={styles.newline}>
                    <input 
                    type="radio" 
                    name="duration" 
                    value="fixed" 
                    onChange={(e) => setDuration(e.target.value)}
                    />
                    Fixed Value
                </label>
                <label className={styles.newline}>
                    <input 
                    type="radio" 
                    name="duration" 
                    value="uniform-dist" 
                    onChange={(e) => setDuration(e.target.value)}
                    />
                    Sample from Uniform Distribution
                </label>
                <label>
                    <input 
                    type="radio" 
                    name="duration" 
                    value="normal-dist" 
                    onChange={(e) => setDuration(e.target.value)}
                    />
                    Sample from Normal Distribution
                </label>
                {duration === "fixed" && (
                    <label className={styles.newline}>
                        Fixed Value
                        <input type="number" name="fixed-value" className={styles.newline} min="1" />
                    </label>
                )}
                {duration === "uniform-dist" && (
                    <>
                    <label className={styles.newline}>
                        Lower Bound
                        <input type="number" name="lower-bound" min="0" />
                        Upper Bound
                        <input type="number" name="upper-bound" min="0" />
                    </label>
                    <label>
                        Calculated Year
                        <input type="number" name="calculated-duration" className={styles.newline} disabled />
                    </label>
                    </>
                )}
                {duration === "normal-dist" && (
                    <>
                    <label className={styles.newline}>
                        Mean
                        <input type="number" name="mean" min="1" />
                        Standard Deviation
                        <input type="number" name="std-dev" min="0" />
                    </label>
                    <label>
                        Calculated Duration
                        <input type="number" name="calculated-duration" className={styles.newline} disabled />
                    </label>
                    </>
                )}
                
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