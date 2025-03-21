import React from "react";

const Investments = () => {
    return (
        <div>
            <h2>Investments</h2>
            <p>
              If married, investments will automatically be assumed as jointly owned.
            </p>
            <form>
                <label>
                    Investment Type
                    <input type="text" name="cash" value="Cash" disabled />
                </label>
            </form>
        </div>
    );
};

export default Investments;