import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Axios from "axios";

import Layout from "../components/Layout";

const NewScenario = () => {

    const navigate = useNavigate();

    useEffect(() => {
        Axios.defaults.baseURL = import.meta.env.VITE_SERVER_ADDRESS;
        Axios.defaults.withCredentials = true;

        // Create a new scenario and get its ID
        Axios.post('/newScenario')
            .then((response) => {
                const newScenarioId = response.data.newScenarioId;
                console.log('New Scenario ID:', newScenarioId);
                navigate(`/ScenarioForm/${newScenarioId}`);
            })
            .catch((error) => {
                console.error('Error creating new scenario:', error);
            });
    }, [navigate]);

    return (
        <Layout>
            <h1>Creating New Scenario...</h1>
        </Layout>
    );
}

export default NewScenario;

//TODO: Need to figure out how to handle the URL and where to place the useEffect hook.