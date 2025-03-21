import React from "react";

const BasicInfo1 = () => {
    return (
        <div>
            <h2>Basic Information</h2>
            <form>
                <label>
                    Scenario Name
                    <input type="text" name="name" />
                </label>
                <br />
                <label>
                    First Name
                    <input type="text" name="first-name" />
                </label>
                <label>
                    Last Name
                    <input type="text" name="last-name" />
                </label>
                <br />
                <label>
                    Financial Goal
                    <p>
                      Specify a non-negative number representing the desired yearly 
                      minimum total value of your investments.
                    </p>
                    <input type="number" name="financial-goal" />
                </label>
                <br />
                <label>
                    State of Residence
                    <input type="text" name="state" />
                </label>
            </form>
        </div>
    );
};

export default BasicInfo1;