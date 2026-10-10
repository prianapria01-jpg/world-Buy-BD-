import React, { useState, useEffect } from "react";

interface SceneItem {
  title: string;
  description: string;
  progress: number;
  type: string;
}

const scenes: SceneItem[] = [
  {
    title: "Customer Payment",
    description: "Customer pays World Buy BD for the selected product.",
    progress: 8,
    type: "payment",
  },
  {
    title: "World Buy BD Pays Seller",
    description: "After receiving the customer's payment, World Buy BD pays the seller.",
    progress: 16,
    type: "sellerPayment",
  },
  {
    title: "Seller Preparation — 3 Days",
    description: "Seller receives the payment and prepares the product. The seller will send the product after 3 days.",
    progress: 25,
    type: "preparation",
  },
  {
    title: "Seller Sends Product",
    description: "After 3 days, the seller sends the product by cargo truck to the China warehouse.",
    progress: 34,
    type: "truck",
  },
  {
    title: "China Warehouse",
    description: "The product arrives at the World Buy BD China warehouse and is received.",
    progress: 43,
    type: "warehouse",
  },
  {
    title: "Air Shipment Preparation",
    description: "The product is checked, packed and prepared for air shipment.",
    progress: 51,
    type: "shipment",
  },
  {
    title: "Air Shipment",
    description: "The prepared product is loaded onto an aircraft and shipped from China to Bangladesh.",
    progress: 61,
    type: "plane",
  },
  {
    title: "Bangladesh Customs",
    description: "The product arrives in Bangladesh and enters the customs process.",
    progress: 70,
    type: "customs",
  },
  {
    title: "Customs Clearance",
    description: "Customs processing is completed and the shipment is released.",
    progress: 77,
    type: "clearance",
  },
  {
    title: "Transport to World Buy BD Warehouse",
    description: "The shipment is transported from Bangladesh customs to the World Buy BD warehouse.",
    progress: 85,
    type: "warehouseBD",
  },
  {
    title: "Product Sorting",
    description: "Products are sorted and organized according to customer orders.",
    progress: 92,
    type: "sorting",
  },
  {
    title: "Delivery",
    description: "The final package leaves the World Buy BD warehouse and is delivered to the customer.",
    progress: 97,
    type: "delivery",
  },
  {
    title: "Order Delivered",
    description: "The customer has successfully received the product. Order completed.",
    progress: 100,
    type: "final",
  },
];

export default function OrderJourney() {
  const [currentScene, setCurrentScene] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentScene((prev) => (prev + 1 >= scenes.length ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const scene = scenes[currentScene];

  const renderSceneContent = (type: string) => {
    switch (type) {
      case "payment":
        return (
          <>
            <div className="wb-oj-payment">
              <div className="wb-oj-person">
                <div className="wb-oj-head"></div>
                <div className="wb-oj-body"></div>
              </div>
              <div className="wb-oj-arrow">→</div>
              <div className="wb-oj-main-icon">💳</div>
              <div className="wb-oj-money">💰</div>
            </div>
            <div className="wb-oj-scene-label">CUSTOMER → WORLD BUY BD</div>
          </>
        );

      case "sellerPayment":
        return (
          <>
            <div className="wb-oj-payment">
              <div className="wb-oj-main-icon">💰</div>
              <div className="wb-oj-arrow">→</div>
              <div className="wb-oj-main-icon">🏪</div>
            </div>
            <div className="wb-oj-scene-label">WORLD BUY BD → SELLER</div>
          </>
        );

      case "preparation":
        return (
          <>
            <div className="wb-oj-main-icon">📦</div>
            <div className="wb-oj-scene-label">SELLER PREPARATION • 3 DAYS</div>
          </>
        );

      case "truck":
        return (
          <>
            <div className="wb-oj-truck-wrap">
              <div className="wb-oj-truck">
                <div className="wb-oj-truck-box">📦</div>
                <div className="wb-oj-truck-cabin">
                  <div className="wb-oj-window"></div>
                </div>
                <div className="wb-oj-wheel wb-oj-one"></div>
                <div className="wb-oj-wheel wb-oj-two"></div>
              </div>
            </div>
            <div className="wb-oj-scene-label">SELLER → CHINA WAREHOUSE</div>
          </>
        );

      case "warehouse":
        return (
          <>
            <div className="wb-oj-warehouse">
              <div className="wb-oj-warehouse-roof"></div>
              <div className="wb-oj-warehouse-sign">CHINA WAREHOUSE</div>
              <div className="wb-oj-warehouse-door"></div>
            </div>
            <div className="wb-oj-scene-label">PRODUCT RECEIVED</div>
          </>
        );

      case "shipment":
        return (
          <>
            <div className="wb-oj-main-icon">📦</div>
            <div className="wb-oj-scene-label">PACKED • VERIFIED • READY FOR AIR SHIPMENT</div>
          </>
        );

      case "plane":
        return (
          <>
            <div className="wb-oj-flight-path"></div>
            <div className="wb-oj-plane-wrap">✈️</div>
            <div className="wb-oj-scene-label">CHINA ✈ → BANGLADESH 🇧🇩</div>
          </>
        );

      case "customs":
        return (
          <>
            <div className="wb-oj-customs">
              <div className="wb-oj-customs-gate">
                <div className="wb-oj-customs-text">BANGLADESH CUSTOMS</div>
                <div className="wb-oj-barrier"></div>
              </div>
            </div>
            <div className="wb-oj-scene-label">CUSTOMS PROCESSING</div>
          </>
        );

      case "clearance":
        return (
          <>
            <div className="wb-oj-main-icon">✅</div>
            <div className="wb-oj-scene-label">CUSTOMS CLEARED</div>
          </>
        );

      case "warehouseBD":
        return (
          <>
            <div className="wb-oj-warehouse">
              <div className="wb-oj-warehouse-roof"></div>
              <div className="wb-oj-warehouse-sign">WORLD BUY BD</div>
              <div className="wb-oj-warehouse-door"></div>
            </div>
            <div className="wb-oj-scene-label">BANGLADESH WAREHOUSE</div>
          </>
        );

      case "sorting":
        return (
          <>
            <div className="wb-oj-sorting">
              <div className="wb-oj-sort-box wb-oj-sb1">📦</div>
              <div className="wb-oj-sort-box wb-oj-sb2">📦</div>
              <div className="wb-oj-sort-box wb-oj-sb3">📦</div>
              <div className="wb-oj-conveyor"></div>
            </div>
            <div className="wb-oj-scene-label">ORDER SORTING</div>
          </>
        );

      case "delivery":
        return (
          <>
            <div className="wb-oj-delivery">
              <div className="wb-oj-truck">
                <div className="wb-oj-truck-box">📦</div>
                <div className="wb-oj-truck-cabin">
                  <div className="wb-oj-window"></div>
                </div>
                <div className="wb-oj-wheel wb-oj-one"></div>
                <div className="wb-oj-wheel wb-oj-two"></div>
              </div>
            </div>
            <div className="wb-oj-scene-label">WORLD BUY BD → CUSTOMER</div>
          </>
        );

      case "final":
        return (
          <>
            <div className="wb-oj-final">
              <div className="wb-oj-final-person">
                <div className="wb-oj-head"></div>
                <div className="wb-oj-body wb-oj-body-blue"></div>
              </div>
              <div className="wb-oj-package">📦</div>
              <div style={{ fontSize: "70px", animation: "wbOjFloating 2s infinite" }}>
                ✓
              </div>
            </div>
            <div className="wb-oj-scene-label">ORDER DELIVERED SUCCESSFULLY</div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full my-4">
      <style>{`
        /* Scoped styles for Order Journey Component */
        .wb-oj-wrapper {
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
          overflow: hidden;
          border-radius: 20px;
          background: linear-gradient(145deg, #10231e, #07120f 60%, #050b0a);
          border: 1px solid rgba(255,255,255,.09);
          box-shadow: 0 16px 40px rgba(0,0,0,.5), inset 0 1px rgba(255,255,255,.08);
          color: #fff;
          font-family: Inter, system-ui, -apple-system, sans-serif;
        }

        .wb-oj-header {
          min-height: 46px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 16px;
          border-bottom: 1px solid rgba(255,255,255,.08);
          background: rgba(255,255,255,.025);
          backdrop-filter: blur(20px);
        }

        .wb-oj-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .wb-oj-logo {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          font-weight: 900;
          font-size: 12px;
          background: linear-gradient(135deg, #00e08d, #007c59);
          box-shadow: 0 0 18px rgba(0,208,132,.25);
          color: #fff;
        }

        .wb-oj-brand h3 {
          font-size: 13.5px;
          font-weight: 800;
          letter-spacing: .2px;
          color: #fff;
          line-height: 1.2;
          margin: 0;
        }

        .wb-oj-brand span {
          display: block;
          margin-top: 1px;
          color: #82978f;
          font-size: 9.5px;
        }

        .wb-oj-live {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 3px 9px;
          border-radius: 20px;
          font-size: 9px;
          font-weight: 700;
          color: #62edb5;
          background: rgba(0,208,132,.07);
          border: 1px solid rgba(0,208,132,.2);
        }

        .wb-oj-live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #00e18c;
          box-shadow: 0 0 10px #00e18c;
          animation: wbOjLiveBlink 1.2s infinite;
        }

        @keyframes wbOjLiveBlink {
          50% { opacity: .25; }
        }

        .wb-oj-progress-area {
          padding: 8px 16px 0;
        }

        .wb-oj-progress-top {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
          color: #80958e;
          font-size: 10px;
          font-weight: 600;
        }

        .wb-oj-progress {
          width: 100%;
          height: 4px;
          overflow: hidden;
          border-radius: 20px;
          background: #172b26;
        }

        .wb-oj-progress-bar {
          height: 100%;
          border-radius: 20px;
          background: linear-gradient(90deg, #00d084, #00aaff);
          box-shadow: 0 0 10px rgba(0,208,132,.6);
          transition: width .7s ease;
        }

        .wb-oj-stage {
          height: 195px;
          position: relative;
          overflow: hidden;
          margin: 8px 12px 0;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,.07);
          background: linear-gradient(to bottom, #071b2b 0%, #123d55 42%, #182b2b 43%, #0b1615 100%);
          perspective: 1000px;
          box-shadow: inset 0 0 50px rgba(0,0,0,.35);
        }

        .wb-oj-sun {
          position: absolute;
          width: 42px;
          height: 42px;
          top: 14px;
          right: 10%;
          border-radius: 50%;
          background: radial-gradient(circle, #fff7c4, #ffc75e 45%, rgba(255,170,0,.03) 70%);
          box-shadow: 0 0 30px rgba(255,190,70,.35);
        }

        .wb-oj-cloud {
          position: absolute;
          width: 65px;
          height: 15px;
          border-radius: 30px;
          background: rgba(255,255,255,.07);
          animation: wbOjCloudMove 18s linear infinite;
        }

        .wb-oj-cloud:before, .wb-oj-cloud:after {
          content: "";
          position: absolute;
          border-radius: 50%;
          background: inherit;
        }

        .wb-oj-cloud:before {
          width: 26px;
          height: 26px;
          left: 8px;
          bottom: 0;
        }

        .wb-oj-cloud:after {
          width: 32px;
          height: 32px;
          right: 8px;
          bottom: 0;
        }

        .wb-oj-cloud.one {
          left: -80px;
          top: 25px;
        }

        .wb-oj-cloud.two {
          left: -160px;
          top: 55px;
          transform: scale(.7);
          animation-delay: 7s;
        }

        @keyframes wbOjCloudMove {
          to { transform: translateX(calc(100vw + 200px)); }
        }

        .wb-oj-city {
          position: absolute;
          left: 0;
          bottom: 38px;
          width: 100%;
          height: 60px;
          display: flex;
          align-items: flex-end;
          gap: 4px;
          opacity: .6;
        }

        .wb-oj-building {
          position: relative;
          width: 22px;
          flex-shrink: 0;
          background: linear-gradient(90deg, #102a2d, #183e40);
          border: 1px solid rgba(255,255,255,.04);
        }

        .wb-oj-building:after {
          content: "";
          position: absolute;
          top: 5px;
          left: 3px;
          width: 3px;
          height: 3px;
          background: #ffd76a;
          box-shadow: 6px 0 #ffd76a, 12px 0 #ffd76a, 0 8px #ffd76a, 6px 8px #ffd76a, 12px 8px #ffd76a, 0 16px #ffd76a, 12px 16px #ffd76a;
          opacity: .35;
        }

        .wb-oj-ground {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 44px;
          background: linear-gradient(to bottom, #1a2926, #07100f);
        }

        .wb-oj-road {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 5px;
          height: 30px;
          background: #111a19;
          transform: perspective(400px) rotateX(35deg);
          transform-origin: bottom;
        }

        .wb-oj-road-line {
          position: absolute;
          top: 13px;
          width: 100%;
          height: 2px;
          background: repeating-linear-gradient(90deg, #e9d36d 0 30px, transparent 30px 55px);
          opacity: .65;
        }

        .wb-oj-scene-content {
          position: absolute;
          inset: 0;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: wbOjSceneFade .65s ease;
        }

        @keyframes wbOjSceneFade {
          from { opacity: 0; transform: scale(.9) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .wb-oj-main-icon {
          width: 65px;
          height: 65px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          border-radius: 18px;
          background: linear-gradient(145deg, rgba(255,255,255,.16), rgba(255,255,255,.03));
          border: 1px solid rgba(255,255,255,.15);
          box-shadow: 0 14px 28px rgba(0,0,0,.45), inset 0 1px rgba(255,255,255,.2);
          transform: rotateX(8deg) rotateY(-8deg);
          animation: wbOjFloating 3s ease-in-out infinite;
        }

        @keyframes wbOjFloating {
          50% { transform: rotateX(8deg) rotateY(-8deg) translateY(-6px); }
        }

        .wb-oj-scene-label {
          position: absolute;
          bottom: 6px;
          padding: 3px 9px;
          border-radius: 14px;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: .4px;
          background: rgba(0,0,0,.65);
          border: 1px solid rgba(255,255,255,.12);
          backdrop-filter: blur(12px);
          white-space: nowrap;
          color: #a4ebd0;
        }

        .wb-oj-payment {
          display: flex;
          align-items: center;
          gap: 16px;
          transform: scale(.58);
        }

        .wb-oj-person {
          width: 80px;
          height: 120px;
          position: relative;
        }

        .wb-oj-head {
          width: 45px;
          height: 45px;
          margin: auto;
          border-radius: 50%;
          background: #ffd2ad;
        }

        .wb-oj-body {
          width: 60px;
          height: 65px;
          margin: 7px auto;
          border-radius: 20px 20px 10px 10px;
          background: linear-gradient(135deg, #167c65, #00d084);
        }

        .wb-oj-body-blue {
          background: linear-gradient(135deg, #2675ff, #4a9cff) !important;
        }

        .wb-oj-money {
          font-size: 28px;
          animation: wbOjMoneyFloat 1.5s ease-in-out infinite;
        }

        @keyframes wbOjMoneyFloat {
          50% { transform: translateY(-7px) rotate(8deg); }
        }

        .wb-oj-arrow {
          font-size: 22px;
          color: #4dffc0;
          animation: wbOjArrowPulse 1s infinite;
        }

        @keyframes wbOjArrowPulse {
          50% { transform: translateX(5px); opacity: .5; }
        }

        .wb-oj-truck-wrap, .wb-oj-delivery {
          position: absolute;
          left: -220px;
          bottom: 18px;
          z-index: 40;
          animation: wbOjRealTruckMove 4s cubic-bezier(.2,.7,.2,1) forwards;
        }

        .wb-oj-truck {
          position: relative;
          width: 310px;
          height: 125px;
          transform: perspective(700px) rotateY(-3deg) scale(.42);
          transform-origin: center bottom;
          filter: drop-shadow(0 10px 8px rgba(0,0,0,.45));
        }

        .wb-oj-truck-box {
          position: absolute;
          left: 0;
          top: 12px;
          width: 205px;
          height: 92px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px 5px 5px 7px;
          color: white;
          font-size: 15px;
          font-weight: 900;
          letter-spacing: 1px;
          background: linear-gradient(145deg, #13c98f 0%, #07956b 45%, #05694e 100%);
          border: 2px solid rgba(255,255,255,.22);
          box-shadow: inset 0 2px rgba(255,255,255,.18), inset -12px 0 20px rgba(0,0,0,.16), 12px 18px 30px rgba(0,0,0,.35);
        }

        .wb-oj-truck-box::before {
          content: "WORLD BUY BD";
          position: absolute;
          top: 33px;
          left: 0;
          right: 0;
          text-align: center;
          font-size: 12px;
          color: rgba(255,255,255,.85);
          font-weight: 900;
        }

        .wb-oj-truck-box::after {
          content: "";
          position: absolute;
          top: 7px;
          left: 8px;
          right: 8px;
          height: 4px;
          border-radius: 10px;
          background: rgba(255,255,255,.25);
        }

        .wb-oj-truck-cabin {
          position: absolute;
          right: 0;
          bottom: 0;
          width: 112px;
          height: 88px;
          border-radius: 8px 18px 8px 5px;
          background: linear-gradient(135deg, #12bff5 0%, #087da9 48%, #07516d 100%);
          border: 2px solid rgba(255,255,255,.22);
          box-shadow: inset 0 2px rgba(255,255,255,.18), inset -12px 0 18px rgba(0,0,0,.18), 8px 15px 25px rgba(0,0,0,.3);
        }

        .wb-oj-window {
          position: absolute;
          top: 12px;
          left: 13px;
          width: 70px;
          height: 34px;
          border-radius: 5px 12px 5px 5px;
          background: linear-gradient(135deg, #a9eaff, #17475d 55%, #081d27);
          border: 2px solid rgba(255,255,255,.25);
          box-shadow: inset 0 3px 6px rgba(255,255,255,.15);
        }

        .wb-oj-window::after {
          content: "";
          position: absolute;
          width: 35px;
          height: 3px;
          top: 7px;
          left: 8px;
          transform: rotate(-25deg);
          background: rgba(255,255,255,.45);
          border-radius: 20px;
        }

        .wb-oj-truck-cabin::before {
          content: "";
          position: absolute;
          top: 40px;
          right: -14px;
          width: 17px;
          height: 9px;
          border-radius: 5px;
          background: #111c20;
          border: 2px solid #5c747a;
        }

        .wb-oj-truck-cabin::after {
          content: "";
          position: absolute;
          right: 5px;
          bottom: 17px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #fff6bd;
          box-shadow: 0 0 12px #ffe68a, 0 0 25px rgba(255,220,100,.7);
        }

        .wb-oj-wheel {
          position: absolute;
          bottom: -22px;
          width: 47px;
          height: 47px;
          border-radius: 50%;
          background: radial-gradient(circle, #626e70 0 18%, #202728 19% 38%, #070909 39% 70%, #394447 71% 78%, #050606 79%);
          border: 3px solid #111718;
          box-shadow: 0 7px 10px rgba(0,0,0,.5), inset 0 0 0 3px #343d3f;
        }

        .wb-oj-wheel.wb-oj-one { left: 43px; }
        .wb-oj-wheel.wb-oj-two { right: 31px; }

        .wb-oj-truck::after {
          content: "";
          position: absolute;
          left: 135px;
          bottom: -22px;
          width: 47px;
          height: 47px;
          border-radius: 50%;
          background: radial-gradient(circle, #626e70 0 18%, #202728 19% 38%, #070909 39% 70%, #394447 71% 78%, #050606 79%);
          border: 3px solid #111718;
          box-shadow: 0 7px 10px rgba(0,0,0,.5);
        }

        .wb-oj-truck-wrap::before, .wb-oj-delivery::before {
          content: "";
          position: absolute;
          width: 280px;
          height: 25px;
          left: 20px;
          bottom: -35px;
          border-radius: 50%;
          background: rgba(0,0,0,.55);
          filter: blur(8px);
        }

        @keyframes wbOjRealTruckMove {
          0% { left: -220px; }
          100% { left: calc(100% + 40px); }
        }

        .wb-oj-delivery {
          animation: wbOjDeliveryMove 4s cubic-bezier(.2,.7,.2,1) forwards;
        }

        .wb-oj-delivery .wb-oj-truck-box {
          background: linear-gradient(145deg, #00d084, #07845f 50%, #04543f);
        }

        @keyframes wbOjDeliveryMove {
          0% { left: -220px; }
          100% { left: calc(100% + 40px); }
        }

        .wb-oj-plane-wrap {
          position: absolute;
          left: -100px;
          top: 60px;
          z-index: 50;
          font-size: 28px;
          line-height: 1;
          filter: drop-shadow(0 6px 6px rgba(0,0,0,.45));
          animation: wbOjPlaneFly 4s cubic-bezier(.25,.6,.25,1) forwards;
        }

        @keyframes wbOjPlaneFly {
          0% { left: -100px; top: 90px; opacity: 0; transform: rotate(-5deg) scale(.7); }
          10% { opacity: 1; }
          45% { top: 35px; transform: rotate(-2deg) scale(.82); }
          75% { top: 48px; }
          100% { left: calc(100% + 50px); top: 70px; opacity: 1; transform: rotate(4deg) scale(.75); }
        }

        .wb-oj-plane-wrap::after {
          content: "";
          position: absolute;
          width: 70px;
          height: 2px;
          right: 22px;
          top: 13px;
          border-radius: 20px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.45));
          filter: blur(1px);
          opacity: .55;
        }

        .wb-oj-flight-path {
          position: absolute;
          width: 100%;
          left: 0;
          top: 98px;
          border-top: 1.5px dashed rgba(255,255,255,.2);
        }

        .wb-oj-customs {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          transform: scale(.5);
          transform-origin: center center;
        }

        .wb-oj-customs-gate {
          width: 300px;
          height: 125px;
          position: relative;
          border: 8px solid #e1b94b;
          border-bottom: 0;
          box-shadow: 0 20px 30px rgba(0,0,0,.4);
        }

        .wb-oj-customs-text {
          position: absolute;
          top: 15px;
          left: 50%;
          transform: translateX(-50%);
          color: #ffe58c;
          font-size: 17px;
          font-weight: 900;
          white-space: nowrap;
        }

        .wb-oj-barrier {
          position: absolute;
          bottom: 16px;
          left: 50%;
          width: 150px;
          height: 10px;
          transform-origin: left;
          background: #f04444;
          animation: wbOjBarrierOpen 2s infinite;
        }

        @keyframes wbOjBarrierOpen {
          50% { transform: rotate(-45deg); }
        }

        .wb-oj-warehouse {
          width: 300px;
          height: 140px;
          position: relative;
          border-radius: 8px;
          background: linear-gradient(145deg, #234a42, #102a25);
          box-shadow: 0 18px 30px rgba(0,0,0,.45);
          transform: scale(.52);
          transform-origin: center center;
        }

        .wb-oj-warehouse-roof {
          position: absolute;
          top: -20px;
          left: -12px;
          width: 324px;
          height: 28px;
          background: #00a878;
          clip-path: polygon(0 100%, 7% 0, 93% 0, 100% 100%);
        }

        .wb-oj-warehouse-door {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 80px;
          height: 88px;
          background: #081815;
          border: 2.5px solid #49645d;
        }

        .wb-oj-warehouse-sign {
          position: absolute;
          top: 15px;
          left: 50%;
          transform: translateX(-50%);
          font-weight: 900;
          font-size: 15px;
          color: #5affbf;
          white-space: nowrap;
        }

        .wb-oj-sorting {
          width: 440px;
          height: 140px;
          position: relative;
          transform: scale(.5);
          transform-origin: center center;
        }

        .wb-oj-conveyor {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 18px;
          height: 44px;
          border-radius: 12px;
          background: #182c28;
          border: 2px solid #36554c;
          transform: skewY(-4deg);
          overflow: hidden;
        }

        .wb-oj-conveyor:after {
          content: "";
          position: absolute;
          inset: 8px;
          background: repeating-linear-gradient(90deg, #638078 0 18px, transparent 18px 32px);
          animation: wbOjConveyorMove .8s linear infinite;
        }

        @keyframes wbOjConveyorMove {
          to { transform: translateX(32px); }
        }

        .wb-oj-sort-box {
          position: absolute;
          bottom: 60px;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          border-radius: 7px;
          background: linear-gradient(145deg, #d39b55, #855a2f);
          box-shadow: 0 10px 14px rgba(0,0,0,.4);
        }

        .wb-oj-sort-box.wb-oj-sb1 { left: 45px; }
        .wb-oj-sort-box.wb-oj-sb2 { left: 180px; }
        .wb-oj-sort-box.wb-oj-sb3 { left: 315px; }

        .wb-oj-final {
          display: flex;
          align-items: center;
          gap: 18px;
          transform: scale(.55);
        }

        .wb-oj-final-person {
          text-align: center;
        }

        .wb-oj-package {
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          border-radius: 14px;
          background: linear-gradient(145deg, #dba15d, #8e5c2c);
          animation: wbOjPackageBounce 1.5s infinite;
        }

        @keyframes wbOjPackageBounce {
          50% { transform: translateY(-8px) rotate(4deg); }
        }

        .wb-oj-info {
          min-height: 50px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin: 7px 12px 9px;
          padding: 7px 12px;
          border-radius: 12px;
          background: linear-gradient(145deg, rgba(255,255,255,.07), rgba(255,255,255,.025));
          border: 1px solid rgba(255,255,255,.08);
          backdrop-filter: blur(15px);
        }

        .wb-oj-step-number {
          min-width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 900;
          background: linear-gradient(135deg, #00d084, #007b5b);
          box-shadow: 0 6px 14px rgba(0,208,132,.2);
          color: #fff;
        }

        .wb-oj-info-text {
          flex: 1;
        }

        .wb-oj-info-text h4 {
          margin: 0;
          font-size: 13px;
          font-weight: 800;
          color: #fff;
          letter-spacing: .2px;
        }

        .wb-oj-info-text p {
          margin: 0;
          color: #91a69f;
          font-size: 10px;
          line-height: 1.35;
        }

        .wb-oj-percent {
          color: #55eeb4;
          font-size: 15px;
          font-weight: 900;
        }

        .wb-oj-steps {
          display: flex;
          justify-content: center;
          gap: 3px;
          padding: 0 12px 10px;
        }

        .wb-oj-step-dot {
          height: 3px;
          flex: 1;
          max-width: 48px;
          border-radius: 15px;
          background: #1b302b;
          transition: .4s;
          cursor: pointer;
        }

        .wb-oj-step-dot.active {
          background: #00d084;
          box-shadow: 0 0 8px rgba(0,208,132,.7);
        }

        @media(max-width: 600px) {
          .wb-oj-wrapper { border-radius: 14px; }
          .wb-oj-header { padding: 6px 10px; min-height: 40px; }
          .wb-oj-brand h3 { font-size: 12px; }
          .wb-oj-live { display: none; }
          .wb-oj-stage { height: 165px; margin: 6px 8px 0; }
          .wb-oj-payment { gap: 10px; transform: scale(.46); }
          .wb-oj-main-icon { width: 50px; height: 50px; font-size: 24px; }
          .wb-oj-truck { transform: perspective(700px) rotateY(-3deg) scale(.33); transform-origin: center bottom; }
          .wb-oj-truck-wrap, .wb-oj-delivery { left: -170px; bottom: 14px; }
          .wb-oj-plane-wrap { font-size: 22px; }
          .wb-oj-customs-gate { width: 220px; height: 95px; }
          .wb-oj-customs-text { font-size: 12px; }
          .wb-oj-warehouse { width: 220px; }
          .wb-oj-warehouse-roof { width: 245px; }
          .wb-oj-sorting { transform: scale(.4); transform-origin: center center; }
          .wb-oj-info { margin: 6px 8px 8px; padding: 6px 10px; min-height: 44px; }
          .wb-oj-info-text h4 { font-size: 12px; }
          .wb-oj-info-text p { font-size: 9px; }
          .wb-oj-percent { font-size: 13.5px; }
          .wb-oj-steps { padding: 0 8px 8px; gap: 2px; }
        }
      `}</style>

      <div className="wb-oj-wrapper">
        {/* Header */}
        <div className="wb-oj-header">
          <div className="wb-oj-brand">
            <div className="wb-oj-logo">WB</div>
            <div>
              <h3>World Buy BD</h3>
              <span>Order Journey • Live Tracking</span>
            </div>
          </div>

          <div className="wb-oj-live">
            <span className="wb-oj-live-dot"></span>
            LIVE ORDER JOURNEY
          </div>
        </div>

        {/* Progress */}
        <div className="wb-oj-progress-area">
          <div className="wb-oj-progress-top">
            <span>{scene.title}</span>
            <span>{scene.progress}%</span>
          </div>

          <div className="wb-oj-progress">
            <div
              className="wb-oj-progress-bar"
              style={{ width: `${scene.progress}%` }}
            ></div>
          </div>
        </div>

        {/* Main Stage */}
        <div className="wb-oj-stage">
          <div className="wb-oj-sun"></div>
          <div className="wb-oj-cloud one"></div>
          <div className="wb-oj-cloud two"></div>

          {/* City Skyline */}
          <div className="wb-oj-city">
            {[80, 120, 70, 145, 100, 130, 85, 155, 105, 135, 75, 125, 90, 150, 110].map(
              (h, idx) => (
                <div
                  key={idx}
                  className="wb-oj-building"
                  style={{ height: `${h}px` }}
                ></div>
              )
            )}
          </div>

          <div className="wb-oj-ground"></div>
          <div className="wb-oj-road">
            <div className="wb-oj-road-line"></div>
          </div>

          {/* Dynamic Animated Scene */}
          <div key={currentScene} className="wb-oj-scene-content">
            {renderSceneContent(scene.type)}
          </div>
        </div>

        {/* Info Panel */}
        <div className="wb-oj-info">
          <div className="wb-oj-step-number">
            {String(currentScene + 1).padStart(2, "0")}
          </div>

          <div className="wb-oj-info-text">
            <h4>{scene.title}</h4>
            <p>{scene.description}</p>
          </div>

          <div className="wb-oj-percent">{scene.progress}%</div>
        </div>

        {/* Step Dots */}
        <div className="wb-oj-steps">
          {scenes.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentScene(idx)}
              aria-label={`Jump to step ${idx + 1}`}
              className={`wb-oj-step-dot border-0 ${
                idx <= currentScene ? "active" : ""
              }`}
            ></button>
          ))}
        </div>
      </div>
    </div>
  );
}
