import styles from "./ScenarioSimulation.module.css";
import Investment from "../components/Investment";
import Event from "../components/Event";
import Layout from "../components/Layout";
import Accordion from "../components/Accordion";
import { TbEdit } from "react-icons/tb";
import { TbFileSearch } from "react-icons/tb";
const ScenarioSimulation = () => {
  {/* Note: for strategies, may need to set content to be a list of the names of events/investments*/}
  {/* Note: for investments,not sure if I'm processing the data right... so confirm that too*/}
  {/* Update the basic information with scenario information*/}
    const strategiesData = [
        {
          title: 'Spending Strategy',
          content: [
            "Buy a mechanical keyboard.",
            "Buy a ferrari"]
        },
        {
          title: 'Expense Withdrawal Strategy',
          content: [
            "Bonds",
            "Domestic Stocks"]
        },
        {
          title: 'RMD Strategy',
          content: [
            "Cash",
            "Real Estate"]
        },
        {
          title: 'Roth Conversion Strategy',
          content: [
            "Cash",
            "Real Estate"]
        }
      ];


      const investmentsData = [
        {
          investmentType: {
            name: "Cash",
            taxability: false, //tax-exempt
            expectedAnnualReturn: 7,
          },
          value: 100000,
          taxStatus: "Pre-tax retirement"
        },
        {
          investmentType: {
            name: "Domestic Stocks",
            taxability: true, // Taxable 
            expectedAnnualReturn: 12.8,
          },
          value: 9350,
          taxStatus: "Non-retirement"
        }
      ];
      

      const eventsData = [
        { 
            name: "Buy a mechanical keyboard",
            amount: 200, 
            duration: 1, 
            startYear: 2025, 
            eventType: "Discretionary Expense" },
        { 
           name: "Child's Education",
           amount: 50000,
           duration: 4, 
           startYear: 2028,
           eventType: "Discretionary Expense"
        },
        { 
           name: "Buy S&P 500 Index Fund",
           maximumCash: 10000,
           duration: 10,
           startYear: 2030,
           eventType: "Investment"

         }
      ];

  return (
    <Layout>
    <div className={styles.container}>
        <div className={styles.header}> 
            <div className={styles.title}>

            <h2>Ideal Plan!!</h2>
            {/** To Do: Implement onClick for this later on */}
            <TbFileSearch size ={25} />
            <TbEdit   size ={25} />
            
            </div>
            
            <div className={styles.buttons}>
                <button className={styles.runSimulation}>Run Simulation</button>
                <button className={styles.seeResults}>See Results</button>
            </div>
        </div>
        
        <div>
        <div className={styles.mainContent}>
            <div className={styles.basicInfo}>
                <h3>Basic Information</h3>
                <div className={styles.info}>
                    <div className={styles.infoItem1}>
                        <p>Financial Goal: </p>
                        <div className ={styles.inputInfo}> $1,000,000 </div>
                    </div>
                    <div  className={styles.infoItem2}>
                        <p>State of Residence: </p>
                        <div className ={styles.inputInfo}> California </div>
                    </div>
                    <div  className={styles.infoItem3}>
                        <p>Marital Status: </p>
                        <div className ={styles.inputInfo}> Married </div>
                    </div>
                    <div  className={styles.infoItem4}>
                        <p>Life Expenctancy: </p>
                        <div className ={styles.inputInfo}> 90 years </div>
                    </div>
              </div>
            </div>
        
            <div className={styles.strategies}>
              
            <div className="accordion">
                    {strategiesData.map(({ title, content }) => (
            <Accordion key = {title} title={title} content={content} />
            ))}
      </div>

            </div>
            
            <div className = {styles.investments}>
                <h3 className={styles.investmentTitle}>Investments</h3>

                {/* If below doesn't work w/ middleware, here is this as a reference:
                <Investment 
                    Type="Cash" 
                    DollarValue= {100000}
                    Taxability="Tax-exempt" 
                    AnnualReturn={7}
                    TaxStatus="Pre-tax retirement" 
                />

                <Investment 
                    Type="Domestic Stocks" 
                    DollarValue= {9350}
                    Taxability="Taxable" 
                    AnnualReturn={12.8}
                    TaxStatus="Non-retirement" 
                />
                */}

                {investmentsData.length > 0 ? (
              investmentsData.map((investment, index) => (
                    <Investment
                        key={index}
                        Type={investment.investmentType.name}
                        DollarValue={investment.value}
                        Taxability={investment.investmentType.taxability ? "Taxable" : "Tax-exempt"}
                        AnnualReturn={investment.investmentType.expectedAnnualReturn}
                        TaxStatus={investment.taxStatus}
                    />
              ))
            ) : (
              <p>You currently have no investments. Edit the scenario to add.</p>
            )}

            </div>
            
            <div className={styles.events}>
                <h3 className={styles.eventTitle}>Events</h3>
                {/* If below doesn't work w/ middleware, here is this as a reference hardcoded: 
                
                <Event
                    Name="Buy a mechanical keyboard" 
                    DollarValue= {200}
                    Duration={1}
                    AnnualReturn={1.9}
                    Type="Discretionary Expense"
                />
                <Event 
                    Name="Child's Education" 
                    DollarValue= {50000}
                    Duration={4}
                    AnnualReturn={5}
                    Type="Discretionary Expense"
                />
                */}


                {eventsData.length > 0 ? (
                eventsData.map((event, index) => (
                <Event
                      key={index}
                      Name={event.name} 
                      DollarValue={event.amount ?? event.maximumCash ?? 0} 
                      Duration={event.duration} 
                      StartYear={event.startYear}
                      Type={event.eventType} 
                    />
                  ))
                  
              )
             : (
              <p>You currently have no events. Edit the scenario to add.</p>
            )}
            </div>
        </div>
        </div>
      
    </div>
    </Layout>
  );
};

export default ScenarioSimulation;
