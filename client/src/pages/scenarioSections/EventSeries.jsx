import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaTimes } from 'react-icons/fa';
import { FaEdit } from "react-icons/fa";
import styles from "./Form.module.css";

// This page does not submit any data, so childRef is not used
// TODO: update page to include childRef once event series deletion is implemented
const EventSeries = () => {
  const navigate = useNavigate();
  const newEventSeries = () => {
    navigate("/ScenarioForm/event-series/new");
  }
  // TODO: remove cash from initial state when done testing
  const [events, setEvents] = useState([
    { name: "Cash", type: "Expense" },
  ]);
  // TODO: uncomment out and modify when route has been set up
  useEffect(() => {
    // TODO: remove superficial call to setEvents (to satisfy ESLint for now)
    setEvents([{ name: "Cash", type: "Expense" }]);
    // IIFE
    // (async () => {
    //   try {
    //     const response = await fetch('/api/events');
    //     const data = await response.json();

    //     const formattedEvents = data.map(type => ({
    //       name: type.name,
    //       type: type.name
    //     }));

    //     setEvents(formattedEvents);
    //   } catch (error) {
    //     console.error('Error fetching events:', error);
    //   }
    // })();
  }, []);

  return (
    <div>
      <h2 id={styles.heading}>Event Series</h2>
      <p>
        An event series is a sequence of recurring financial events
        (income, expense, investment, or rebalancing) over a defined period.
        Only one asset allocation can be rebalanced in a scenario.
      </p>
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
                <div className={styles.groupButtons}>
                  <button
                    className={styles.tableButton}
                    onClick={() => {
                      if (index === 0) return;

                      alert("NOT IMPLEMENTED YET")
                    }
                    }
                    style={{ opacity: index === 0 ? 0.2 : 1 }}
                  >
                    <FaEdit />
                  </button>

                  <button
                    className={styles.tableButton}
                    onClick={() => {
                      if (index === 0) return;
                      alert("NOT IMPLEMENTED YET")
                    }
                    }
                    style={{ opacity: index === 0 ? 0.2 : 1 }}
                  >
                    <FaTimes />
                  </button>

                </div>
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