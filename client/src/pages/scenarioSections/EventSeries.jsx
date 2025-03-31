import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { HiDotsVertical } from 'react-icons/hi';
import Axios from 'axios';

import styles from "./Form.module.css";

// This page does not submit any data, so childRef is not used
// TODO: update page to include childRef once event series deletion is implemented
const EventSeries = () => {
  const navigate = useNavigate();
  const { scenarioId } = useParams();

  const [events, setEvents] = useState([]);

  useEffect(() => {
    Axios.defaults.baseURL = import.meta.env.VITE_SERVER_ADDRESS;
    Axios.defaults.withCredentials = true;

    Axios.get(`/events/${scenarioId}`).then((response) => {
      setEvents(response.data);
    }).catch((error) => {
      console.error('Error fetching event series:', error);
    });
  }, [scenarioId]);

  const newEventSeries = () => {
    navigate(`/ScenarioForm/${scenarioId}/event-series/new`);
  }

  return (
    <div>
      <h2>Event Series</h2>
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