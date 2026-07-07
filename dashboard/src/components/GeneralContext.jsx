import React, { useState } from "react";
import BuyActionWindow from "./BuyActionWindow";

const GeneralContext = React.createContext({
  openBuyWindow: () => { },
  closeBuyWindow: () => { },
});


export const GeneralContextProvider = ({ children }) => {


  const [isBuyWindowOpen, setIsBuyWindowOpen] = useState(false);

  const [selectedStock, setSelectedStock] = useState(null);



  const handleOpenBuyWindow = (stock) => {


    setSelectedStock(stock);

    setIsBuyWindowOpen(true);


  };



  const handleCloseBuyWindow = () => {

    setSelectedStock(null);

    setIsBuyWindowOpen(false);

  };



  return (

    <GeneralContext.Provider

      value={{

        openBuyWindow: handleOpenBuyWindow,

        closeBuyWindow: handleCloseBuyWindow

      }}

    >


      {children}


      {

        isBuyWindowOpen &&

        <BuyActionWindow stock={selectedStock} />

      }


    </GeneralContext.Provider>


  );


};



export default GeneralContext;