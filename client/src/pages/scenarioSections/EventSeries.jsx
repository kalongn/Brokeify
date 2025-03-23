// import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiDotsVertical } from 'react-icons/hi';
import styles from "./Form.module.css";

const EventSeries = () => {
  const navigate = useNavigate();
  const newEventSeries = () => {
    navigate("/ScenarioForm/event-series/new");
  }
  // TODO: remove cash from initial state when done testing
  const events = [
    { name: "Cash", type: "Expense" },
    { name: "Cash", type: "Expense" },
    { name: "Cash", type: "Expense" },
  ];
  // const [events, setEvents] = useState([
  //   { name: "Cash", type: "Expense" },
  // ]);
  // const handleInputChange = (index, field, value) => {
  //   const updatedEvents = [...events];
  //   updatedEvents[index][field] = value;
  //   setEvents(updatedEvents);
  // };
  return (
    <div>
      <h2>Event Series</h2>
      <p>
        An event series is a sequence of recurring financial events
        (income, expense, investment, or rebalancing) over a defined period.
        Only one asset allocation can be rebalanced in a scenario.
      </p>
      {/* TODO: fix global table styling */}
      <table id={styles.inputTable}>
        <thead>
          <tr>
            <th>Event Series Name</th>
            <th>Type</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {events.map((event, index) => (
            <tr key={index}>
              <td>
                {event.name}
              </td>
              <td>
                {event.type}
              </td>
              <td>
                <button
                  className={styles.tableButton}
                  onClick={() => alert("NOT IMPLEMENTED YET")}
                >
                  <HiDotsVertical />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button id={styles.addButton} onClick={newEventSeries}>
        Add New Event Series
      </button>
    </div>
  );
};

export default EventSeries;