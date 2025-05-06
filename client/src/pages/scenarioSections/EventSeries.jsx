import { useState, useEffect } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import { FaTimes } from 'react-icons/fa';
import { FaEdit } from "react-icons/fa";
import ErrorMessage from "../../components/ErrorMessage";
import Axios from 'axios';

import styles from "./Form.module.css";
// This page does not submit any data, so childRef is not used
const EventSeries = () => {
  const navigate = useNavigate();
  const { scenarioId } = useParams();

  const [events, setEvents] = useState([]);
  const [errors, setErrors] = useState({});

  const { scenarioHash, fetchScenarioHash } = useOutletContext();

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

  //New route to update scenario
  const editEventSeries = (id) => {
    navigate(`/ScenarioForm/${scenarioId}/event-series/edit/${id}`);
  };

  const removeEventSeries = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event series?")) {
      return;
    }
    try {
      const currentHash = await Axios.get(`/concurrency/${scenarioId}`);
      if (currentHash.data !== scenarioHash) {
        alert("This scenario has been modified by you on another tab or another user. Will be refreshing the page...");
        navigate(0);
        return;
      }

      const response = await Axios.delete(`/event/${scenarioId}/${id}`);
      console.log(response.data);
      const updatedInvestmentTypes = events.filter((event) => event.id !== id);
      setEvents(updatedInvestmentTypes);
    } catch (error) {
      if (error.response?.status === 409) {
        setErrors({ deleteEventSeries: "Cannot delete event series. Another event series's start year depends on it." });
      } else {
        setErrors({ deleteEventSeries: "There was an error deleting the event series. Please try again." });
      }
      console.error("Error deleting event series:", error);
    } finally {
      await fetchScenarioHash();
    }
  }

  return (
    <div>
      <h2 id={styles.heading} data-testid="heading">Event Series</h2>
      <p>
        An event series is a sequence of recurring financial events
        (income, expense, investment, or rebalancing) over a defined period.
        Only one asset allocation can be rebalanced in a scenario.
      </p>
      <ErrorMessage errors={errors} />
      <table id={styles.inputTable}>
        <thead id="deleteEventSeries">
          <tr>
            <th>Event Series Name</th>
            <th>Type</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id}>
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
                    onClick={() => { editEventSeries(event.id); }}
                  >
                    <FaEdit />
                  </button>

                  <button
                    className={styles.tableButton}
                    onClick={() => { removeEventSeries(event.id); }}
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