"use client";
import React, { useState, useRef, useEffect } from "react";
import "../global.css";
import "./main-page.css";
import Head from "next/head";
import Link from "next/link";
import useSWR from "swr";
import io from "socket.io-client";
import { getCampCapacity } from "../../lib/utility";
import { drawTimer, drawError } from "@/lib/drawingUtility";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';


import { useRouter } from "next/router";
import { withSessionSsr } from "@/lib/session";
import axios from "axios";
// for token auth
import { SignJWT } from "jose";
import { getJwtSecretKey } from "@/lib/token-auth";

let socket;

async function fetcher(url) {
  const res = await fetch(url);
  const json = await res.json();
  return json;
}

function loadImages(sources, callback) {
  var newImages = {};
  var loadedImages = 0;
  var numImages = 0;
  // get num of sources
  for (var src in sources) {
    numImages++;
  }
  for (var src in sources) {
    newImages[src] = new Image();
    newImages[src].onload = function () {
      if (++loadedImages >= numImages) {
        callback(newImages);
      }
    };
    newImages[src].src = sources[src];
  }
}

export default function Main(props) {
  const router = useRouter();
  const courseSectionId = parseInt(router.query.class);
  const [selectedRegionName, setselectedRegionName] = useState(null);
  const [selectedCampStats, setSelectedCampStats] = useState(null);
  const selectedCampStatsRef = useRef(null);

  const [selectedGenName, setSelectedGenName] = useState(null);
  const [selectedGenStats, setSelectedGenStats] = useState(null);
  const selectedGenStatsRef = useRef(null);

  const [selectedRouteName, setSelectedRouteName] = useState(null);
  const [selectedRouteStats, setSelectedRouteStats] = useState(null);
  const selectedRouteStatsRef = useRef(null);

  const [activeTab, setActiveTab] = useState("camps");

  const [timerInputSeconds, setTimerInputSeconds] = useState(0);
  const [timerInputMinutes, setTimerInputMinutes] = useState(0);

  const [timerMillisRemaining, setTimerMillisRemaining] = useState(0);

  const [timerStopTime, setTimerStopTime] = useState(0);
  const [timerTimeOffset, setTimerTimeOffset] = useState(0);
  const [timerIsActive, setTimerIsActive] = useState(false);

  const [serverError, setServerError] = useState(false);
  const [serverErrorMessage, setServerErrorMessage] = useState("");

  const setTimerValue = (minutes, seconds) => {
    setTimerInputMinutes(minutes);
    setTimerInputSeconds(seconds);
    //when shortcut button is clicked, start the timer immediately
    //this is a little buggy though, usually button must be double clicked
    //startTimer();
  };

  const canvasRef = useRef(null);
  const defaultSize = { x: 900, y: 720 };
  // device pixel ration, for screens with scaling on
  var dpr = 1;

  // DEBUGGING ///////////
  var drawCampNum = false,
    drawGenNum = false,
    drawPathNum = false;
  ///////////////////////
  const genRadius = 12;
  const campSize = 37; // size of blue square
  const campDangerSize = 39; // size of red box around the blue square
  const [imgLoaded, setImgLoaded] = useState(false);
  const imagesRef = useRef(null);

  // constants for stats box drawing
  const statsInset = 1;
  const statsIconSize = 20;
  const statsYSpacing = 3;
  const statsMargin = { x: 4, y: 4 };
  // constants for gens (red circles)
  const genColor = "#C02F1D"; //"#FF0000";
  // constants for camp stats box drawing
  const campStatsHeight =
    statsIconSize * 5 + statsMargin.y * 2 + statsYSpacing * 4;
  const campStatsWidth = statsIconSize + 40;
  const campStatsBGColor = "#ebebfc"; //'#d9daff';
  // constants for gen stats box drawing
  const genStatsWidth = statsIconSize + 40;
  const genStatsHeight =
    statsIconSize * 3 + statsMargin.y * 2 + statsYSpacing * 2;

  const genStatsBGColor = "#ffe8ef"; // "#efefef";'
  const contentFont = "16px serif";

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showAdminPopup, setShowAdminPopup] = useState(false);
  const [loginErrorMessage, setLoginErrorMessage] = useState("");
  const loggedIn = props.loggedIn;
  const loggedUser = props.username;
  const loggedId = props.userId;
  const token = props.token;

  // Function to toggle the panel's open/close state
  const togglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  const handleLogin = async () => {
    try {
      const response = await axios.post("/api/login", { username, password });

      if (response.data.success) {
        location.reload();
      }
    } catch (error) {
      //setLoginErrorMessage("An unkown error occured");
      if (error.response && error.response.data && error.response.data.message)
        setLoginErrorMessage(error.response.data.message);
      else setLoginErrorMessage("Unknown error occurred");
    }
  };

  const handleLoginClose = () => {
    setShowAdminPopup(false);
    setLoginErrorMessage("");
    setUsername("");
    setPassword("");
  };

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/api/logout", {});
      console.log("Logged out");
      if (res.data.ok) {
        //router.refresh();
        location.reload();
      }
    } catch (error) {
      console.log(error);
      if (error.response && error.response.data && error.response.data.message)
        alert(error.response.data.message);
      else alert("An unknown error occurred");
    }
  };

  const dataRef = useRef(null);
  const { data, error } = useSWR("/map-nodes.json", fetcher);
  const [campStats, setCampStats] = useState(null);
  const campStatsRef = useRef(null);
  const [routeStats, setRouteStats] = useState(null);
  const [genStats, setGenStats] = useState(null);
  const genStatsRef = useRef(null);

  if (error) {
    console.log("error loading json");
  }
  if (!data) console.log("loading map data...");

  function drawCampStats(ctx, position, stats) {
    const imagePos = {
      x: position.x + statsMargin.x,
      y: position.y + statsMargin.y,
    };
    const textPos = {
      x: position.x + statsMargin.x + statsIconSize + 5,
      y: position.y + statsMargin.y + statsIconSize / 2 + 5,
    };

    ctx.fillStyle = "black";
    ctx.fillRect(position.x, position.y, campStatsWidth, campStatsHeight);
    //ctx.fillStyle = "#efefef";
    ctx.fillStyle = campStatsBGColor;
    ctx.fillRect(
      position.x + statsInset,
      position.y + statsInset,
      campStatsWidth - statsInset * 2,
      campStatsHeight - statsInset * 2
    );

    // drawing icons
    if (imagesRef.current != null) {
      const imgArray = [
        imagesRef.current.refugee,
        imagesRef.current.food,
        imagesRef.current.health,
        imagesRef.current.house,
        imagesRef.current.admin,
      ];
      imgArray.forEach((img) => {
        ctx.drawImage(
          img,
          imagePos.x,
          imagePos.y,
          statsIconSize,
          statsIconSize
        );
        imagePos.y += statsIconSize + statsYSpacing;
      });
    }

    // drawing stats text
    ctx.font = contentFont;
    ctx.fillStyle = "black";
    const statsArray = [
      stats.refugeesPresent,
      stats.food,
      stats.healthcare,
      stats.housing,
      stats.admin,
    ];
    statsArray.forEach((stat) => {
      ctx.fillText(stat, textPos.x, textPos.y);
      textPos.y += statsIconSize + statsYSpacing;
    });
  }

  function drawAllGenStats(ctx, mapData, genStats) {
    const position = {
      x: 15,
      y: 30,
    };

    const boxXOffset = 34;

    ctx.font = "22px serif";
    ctx.fillStyle = "white";
    ctx.fillText("Generation Stats: ", position.x, position.y);

    position.y += 25;

    const imagePos = {
      x: position.x + statsMargin.x + boxXOffset,
      y: position.y + statsMargin.y,
    };
    const textPos = {
      x: position.x + statsMargin.x + statsIconSize + boxXOffset + 5,
      y: position.y + statsMargin.y + statsIconSize / 2 + 5,
    };

    if (imagesRef.current != null) {
      var imgArray = [
        imagesRef.current.food,
        imagesRef.current.health,
        imagesRef.current.admin,
      ];
    }

    Object.entries(mapData["regions"]).map(([regionName, regionData]) => {
      if ("gens" in regionData) {
        ctx.font = "16px serif";
        ctx.fillStyle = "white";
        ctx.fillText("Region " + regionName, position.x, position.y);
        position.y += 10;
        textPos.y += 10;
        imagePos.y += 10;
        Object.entries(regionData["gens"]).map(([genName, genData]) => {
          // draw the icon to the left of the box
          drawGenIcon(
            ctx,
            { x: position.x + genRadius, y: position.y + genStatsHeight / 2 },
            genStats[genName].genType,
            genData.letter
          );

          const statsArray = [
            genStats[genName].food,
            genStats[genName].healthcare,
            genStats[genName].admin,
          ];

          ctx.fillStyle = "black";
          ctx.fillRect(
            position.x + boxXOffset,
            position.y,
            genStatsWidth,
            genStatsHeight
          );
          //ctx.fillStyle = "#efefef";
          ctx.fillStyle = campStatsBGColor;
          ctx.fillRect(
            position.x + statsInset + boxXOffset,
            position.y + statsInset,
            genStatsWidth - statsInset * 2,
            genStatsHeight - statsInset * 2
          );

          // drawing icons
          if (imgArray) {
            imgArray.forEach((img) => {
              ctx.drawImage(
                img,
                imagePos.x,
                imagePos.y,
                statsIconSize,
                statsIconSize
              );
              imagePos.y += statsIconSize + statsYSpacing;
            });
          }
          // drawing stats text
          ctx.font = contentFont;
          ctx.fillStyle = "black";

          statsArray.forEach((stat) => {
            ctx.fillText(stat, textPos.x, textPos.y);
            textPos.y += statsIconSize + statsYSpacing;
          });
          //ctx.fillText("Gen " + genData.letter, position.x, position.y);
          position.y += genStatsHeight + 15;
          imagePos.y = position.y + statsMargin.y;
          textPos.y = position.y + statsMargin.y + statsIconSize / 2 + 5;
        });
        position.y += 10;
        (imagePos.y = position.y + statsMargin.y),
          (textPos.y = position.y + statsMargin.y + statsIconSize / 2 + 5);
      }
    });
  }

  function drawGenIcon(ctx, position, genType, letter) {
    // multiplied by circle size to get outer circle size
    const outerCircleRatio = 1.35;

    // outer outline box
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(
      position.x,
      position.y,
      genRadius * outerCircleRatio + 1,
      0,
      2 * Math.PI
    );
    ctx.fill();

    switch (genType) {
      case "ORDERLY":
        ctx.fillStyle = "green";
        break;
      case "DISORDERLY":
        ctx.fillStyle = "yellow";
        break;
      case "PANIC":
        ctx.fillStyle = "RED"; //"#9C0000";
        break;
      default:
        ctx.fillStyle = "green";
    }

    // draw outer circle (color indicating generation type)
    ctx.beginPath();
    ctx.arc(
      position.x,
      position.y,
      genRadius * outerCircleRatio,
      0,
      2 * Math.PI
    );
    ctx.fill();

    // inner outline box
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(position.x, position.y, genRadius + 1, 0, 2 * Math.PI);
    ctx.fill();

    // draw inner red circle
    ctx.beginPath();
    ctx.arc(position.x, position.y, genRadius, 0, 2 * Math.PI);
    ctx.fillStyle = genColor;
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.font = contentFont;
    const textWidth = ctx.measureText(letter).width;
    ctx.fillText(letter, position.x - textWidth / 2, position.y + 5);
  }

  function draw(ctx, campStats, genStats, routeStats) {
    // is there a server error?
    if (serverError) {
      drawError(ctx, { x: 550, y: 300 }, serverErrorMessage);
    }

    // are the stats and map json loaded yet?
    if (!data || !campStats || !routeStats || !genStats) {
      return;
    }

    if (timerIsActive && timerMillisRemaining >= 0) {
      drawTimer(ctx, { x: 480, y: 75 }, timerMillisRemaining);
    }

    drawAllGenStats(ctx, data, genStats);

    ctx.font = contentFont;
    // ctx.fillStyle = 'blue';
    // ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Drawing paths (do this first so nodes are rendered on top)
    ctx.lineWidth = 5;

    ctx.beginPath();
    Object.keys(data["paths"]).map((path, i) => {
      ctx.strokeStyle = "#e8bd20";

      const node = data["paths"][path];
      const startNode = data["paths"][path].start;
      const endNode = data["paths"][path].end;
      var startCoord = { x: 0, y: 0 };
      var endCoord = { x: 0, y: 0 };

      // get the x and y of the camp or gen point
      // start node is camp
      if (startNode.type === "camp") {
        startCoord.x =
          data["regions"][startNode.region]["camps"][startNode.node].x;
        startCoord.y =
          data["regions"][startNode.region]["camps"][startNode.node].y;
      }
      // start node is generation point
      else if (startNode.type === "gen") {
        startCoord.x =
          data["regions"][startNode.region]["gens"][startNode.node].x;
        startCoord.y =
          data["regions"][startNode.region]["gens"][startNode.node].y;
      }
      // end node is camp
      if (endNode.type === "camp") {
        endCoord.x = data["regions"][endNode.region]["camps"][endNode.node].x;
        endCoord.y = data["regions"][endNode.region]["camps"][endNode.node].y;
      }
      // end node is generation point
      else if (endNode.type === "gen") {
        endCoord.x = data["regions"][endNode.region]["gens"][endNode.node].x;
        endCoord.y = data["regions"][endNode.region]["gens"][endNode.node].y;
      }
      var isOpen = true;
      // check if we have data from the database for this path
      if (path in routeStats) {
        // is it open?
        if (!routeStats[path].isOpen) {
          isOpen = false;
          ctx.strokeStyle = "red";
        }
      }

      // ready to draw
      ctx.beginPath();
      ctx.moveTo(startCoord.x, startCoord.y);
      // if control points exist, draw a bezier (curved) line
      if (
        data["paths"][path]["cp1"] != null &&
        data["paths"][path]["cp2"] != null
      ) {
        const cp1 = data["paths"][path]["cp1"];
        const cp2 = data["paths"][path]["cp2"];
        ctx.bezierCurveTo(
          startCoord.x + cp1.x,
          startCoord.y + cp1.y,
          endCoord.x + cp2.x,
          endCoord.y + cp2.y,
          endCoord.x,
          endCoord.y
        );
        ctx.stroke(); // Render the path
      } // no control points, straight line from a to b
      else {
        ctx.lineTo(endCoord.x, endCoord.y);
        ctx.stroke(); // Render the path
      }

      if (drawPathNum || (activeTab === "paths" && isPanelOpen)) {
        ctx.fillStyle = "black";
        ctx.font = contentFont;
        ctx.fillText(
          i + 1,
          (startCoord.x + endCoord.x) / 2,
          (startCoord.y + endCoord.y) / 2
        );
      }
    });

    // loop through regions
    Object.keys(data["regions"]).map((regionNum) => {
      const region = data["regions"][regionNum];
      // how much to offset the inner part of the square
      const bevelOffset = Math.ceil(campSize * 0.1); // 10%
      // how much to offset the outer part of the square (danger indicator)
      const dangerOffset = Math.ceil(campSize * 0.1); // 25%
      // Drawing camps (blue squares)
      if ("camps" in region) {
        // get camp capacity based on the stats
        const campCapacity = getCampCapacity(
          campStats[regionNum].food,
          campStats[regionNum].healthcare,
          campStats[regionNum].housing,
          campStats[regionNum].admin
        );
        // loop through all the camps in the region
        Object.keys(region["camps"]).map((camp) => {
          const campNode = region["camps"][camp];

          // is this camp in danger?
          if (campCapacity < campStats[regionNum].refugeesPresent) {
            // draw a red box around the blue square
            ctx.fillStyle = "red";
            ctx.fillRect(
              campNode.x - campSize / 2 - dangerOffset,
              campNode.y - campSize / 2 - dangerOffset,
              campSize + dangerOffset * 2,
              campSize + dangerOffset * 2
            );
          }
          // draw outer square
          ctx.fillStyle = "#2e35c0"; // blue
          ctx.fillRect(
            campNode.x - campSize / 2,
            campNode.y - campSize / 2,
            campSize,
            campSize
          );
          // draw inner square
          ctx.fillStyle = "#3c66ba"; // light blue
          ctx.fillRect(
            campNode.x - campSize / 2 + bevelOffset,
            campNode.y - campSize / 2 + bevelOffset,
            campSize - bevelOffset * 2,
            campSize - bevelOffset * 2
          );

          // if (drawCampNum) {
          //   ctx.fillStyle = 'white';
          //   ctx.font = contentFont;
          //   ctx.fillText(camp, campNode.x-3, campNode.y+4);
          //   ctx.fillStyle = '#0000CC';
          // }
          // draw capacity on the camp

          ctx.fillStyle = "white";
          ctx.font = contentFont;
          const textWidth = ctx.measureText(campCapacity).width;
          ctx.fillText(
            campCapacity,
            campNode.x - textWidth / 2,
            campNode.y + 6
          );
          ctx.fillStyle = "#0000CC";
        });
      }

      // Drawing generation points (red circles)
      if ("gens" in region) {
        Object.keys(region["gens"]).map((gen_point) => {
          const genNode = region["gens"][gen_point];

          // get stats for this region from campStats
          // camp stats should have data from the database about each region
          var stats = genStats[gen_point];

          drawGenIcon(
            ctx,
            { x: genNode.x, y: genNode.y },
            stats.genType,
            genNode.letter
          );

          // draw number of refugees above and below the gen icon
          var refugees = stats.totalRefugees.toString();
          var newRefugees = " (+" + stats.newRefugees.toString() + ")";
          var refugeeText = refugees + newRefugees;

          ctx.font = "16px serif";
          var textWidth = ctx.measureText(refugeeText).width;
          // black outline
          ctx.fillStyle = "black";
          ctx.fillRect(
            genNode.x - textWidth / 2 - 8,
            genNode.y - 41,
            textWidth + 16,
            22
          );

          ctx.fillStyle = campStatsBGColor;
          ctx.fillRect(
            genNode.x - textWidth / 2 - 7,
            genNode.y - 40,
            textWidth + 14,
            20
          );
          ctx.fillStyle = "black";
          ctx.fillText(refugeeText, genNode.x - textWidth / 2, genNode.y - 25);
          //ctx.fillText(refugees, genNode.x - ctx.measureText(refugees).width / 2, genNode.y-30);
          //ctx.fillText(newRefugees, genNode.x - ctx.measureText(newRefugees).width / 2, genNode.y+30);

          //drawGenStats(ctx, statsPostion, stats);

          if (drawGenNum) {
            ctx.fillStyle = "Black";
            ctx.fillText(gen_point, genNode.x + 15, genNode.y + 15);
            ctx.fillStyle = genColor;
          }
        });
      }
      // draw region label
      if ("labelPos" in region) {
        ctx.font = "18px serif";
        ctx.fillStyle = "green";
        ctx.fillText(regionNum, region["labelPos"].x, region["labelPos"].y);
        ctx.fillStyle = "#0000CC";
      }
      // camp stats
      if (
        "campsStatsPos" in region &&
        campStats &&
        campStats[regionNum] != null
      ) {
        // get stats for this region from campStats
        // camp stats should have data from the database about each region
        var stats = campStats[regionNum];
        const statsPostion = region["campsStatsPos"];
        drawCampStats(ctx, statsPostion, stats);
      }
    });
  }

  function handleInput(clickLoc, data, scale) {}

  // initial useEffect function, will be called on page load
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    window.addEventListener("resize", resize, false);

    function resize() {
      //resize tab content in side panel
      const sidePanel = document.querySelector(".side-panel");
      const tabContents = document.querySelectorAll(".tab-content");
      if (sidePanel && tabContents) {
        const sidePanelHeight = sidePanel.clientHeight;
        const headerHeight =
          document.querySelector(".side-panel-header").clientHeight + 10;
        const tabContentHeight = sidePanelHeight - headerHeight;
        //console.log(tabContentHeight + 'px');
        tabContents.forEach((tabContent) => {
          tabContent.style.height = tabContentHeight + "px";
        });
      }

      // resize canvase
      dpr = window.devicePixelRatio || 1;
      const width = isPanelOpen ? window.innerWidth - 300 : window.innerWidth;
      const height = window.innerHeight;
      const aspectRatio = defaultSize.x / defaultSize.y;

      let canvasWidth = width;
      let canvasHeight = height;

      // calculate canvas dimensions based on constraints
      if (width / aspectRatio > height) {
        canvasWidth = height * aspectRatio;
      } else {
        canvasHeight = width / aspectRatio;
      }

      // adjust canvas dimensions for devicePixelRatio
      canvas.width = canvasWidth * dpr;
      canvas.height = canvasHeight * dpr;

      // scale by device pixel ratio
      ctx.scale(dpr, dpr);

      // apply inverse scaling to canvas CSS
      canvas.style.width = canvasWidth + "px";
      canvas.style.height = canvasHeight + "px";

      // update context scale relative to the default size
      ctx.scale(canvasWidth / defaultSize.x, canvasHeight / defaultSize.y);

      // Redraw content
      draw(ctx, campStats, genStats, routeStats);
    }

    const handleToggle = () => {
      if (!isActive) {
        // Start the timer with the user-specified time
        // For simplicity, let's assume the user input is in seconds
        const totalSeconds = minutes * 60 + seconds;
        setMinutes(Math.floor(totalSeconds / 60));
        setSeconds(totalSeconds % 60);
      }

      setIsActive(!isActive);
    };

    // list of all the images we need to load
    var sources = {
      refugee: "/refugee.png",
      food: "/food.png",
      admin: "/admin.png",
      health: "/health.png",
      house: "/house.png",
    };

    loadImages(sources, function (loadedImages) {
      imagesRef.current = loadedImages;
      setImgLoaded(true);
      draw(ctx, campStats, genStats, routeStats);
    });

    resize();
  });
  // for drawing the timer
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let interval;
    if (timerIsActive) {
      interval = setInterval(() => {
        const time = new Date().getTime();
        const timeRemaining = timerStopTime - time - timerTimeOffset;
        setTimerMillisRemaining(timeRemaining);
        if (timeRemaining <= 0) {
          setTimerMillisRemaining(0);
          setTimerIsActive(false);
          setTimerStopTime(0);
          clearInterval(interval);
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [timerIsActive, timerMillisRemaining]);

  // effect for initializing socket. empty dependancy array to make it run only once
  useEffect(() => {
    const socketInitializer = async () => {
      await fetch("/api/server");

      // is admin loggen in?
      if (loggedIn && token) {
        // create a socket session with token
        socket = io({
          query: {
            courseSectionId: courseSectionId,
            token: props.token,
          },
        });
      } else {
        socket = io({
          query: {
            courseSectionId: courseSectionId,
          },
        });
      }

      socket.on("connect", () => {
        console.log("connected");
      });

      socket.on("load_error", (data) => {
        setServerError(true);
        console.log("DATA:");
        console.log(data);
        setServerErrorMessage(data.message);
      });

      socket.on("camp_stats", (stats, isUpdate) => {
        console.log("Received camp stats on client: ");
        console.log(stats);
        setCampStats(stats);
        // if this is not an update (intial loading), select selected index to 0
        if (!isUpdate) {
          setSelectedCampStats(Object.values(stats)[0]);
          setselectedRegionName(Object.keys(stats)[0]);
        }
      });

      socket.on("routes", (routes, isUpdate) => {
        console.log("Received routes on client: ");
        console.log(routes);
        setRouteStats(routes);
        if (!isUpdate) {
          setSelectedRouteStats(Object.values(routes)[0]);
          setSelectedRouteName(Object.keys(routes)[0]);
        }
      });
      socket.on("gens", (gens, isUpdate) => {
        console.log("Received gen points on client: ");
        console.log(gens);
        setGenStats(gens);
        // if this is not an update (intial loading), select selected index to 0
        if (!isUpdate) {
          setSelectedGenStats(Object.values(gens)[0]);
          setSelectedGenName(Object.keys(gens)[0]);
        }
      });

      socket.on("campsStatsUpdated", (updatedData) => {
        console.log("Camp stats updated:", updatedData);
      });

      socket.on("syncClock", (serverTime) => {
        console.log("syncing time");
        const clientTime = new Date().getTime();
        const offset = serverTime - clientTime;
        socket.emit("syncClock", clientTime, offset);
      });

      socket.on("startTimer", (timeOffset, timerStopTime) => {
        setTimerIsActive(false);
        console.log("Starting timer");
        setTimerTimeOffset(timeOffset);
        const currentTime = new Date().getTime() - timeOffset;
        const timeRemaining = timerStopTime - currentTime;
        if (timeRemaining > 0) {
          console.log("start timer");
          console.log("timer started for " + timeRemaining + " milliseconds");
          setTimerStopTime(timerStopTime);
          setTimerMillisRemaining(timeRemaining);
          setTimerIsActive(true);
        }
      });

      socket.on("stopTimer", () => {
        console.log("Stopping timer");
        setTimerIsActive(false);
      });
    };

    socketInitializer();
    return () => {
      // Add a cleanup function to close the socket connection when the component unmounts
      socket.disconnect();
    };
  }, []);

  const sendCampUpdate = () => {
    const updateData = {
      refugeesPresent: selectedCampStats.refugeesPresent,
      food: selectedCampStats.food,
      healthcare: selectedCampStats.healthcare,
      housing: selectedCampStats.housing,
      admin: selectedCampStats.admin,
    };

    socket.emit(
      "updateCampStats",
      selectedCampStats,
      selectedRegionName,
      courseSectionId
    );
    console.log("Update was sent");
    console.log(updateData);
  };

  const sendGenUpdate = () => {
    const updateData = {
      food: selectedGenStats.food,
      healthcare: selectedGenStats.healthcare,
      admin: selectedGenStats.admin,
      genType: selectedGenStats.genType,
      totalRefugees: selectedGenStats.totalRefugees,
      newRefugees: selectedGenStats.newRefugees,
    };

    socket.emit(
      "updateGenStats",
      selectedGenStats,
      selectedGenName,
      courseSectionId
    );
    console.log("Update was sent");
    console.log(updateData);
  };

  const sendPathUpdate = () => {
    const updateData = {
      isOpen: selectedRouteStats.isOpen,
    };

    socket.emit(
      "updatePathStats",
      selectedRouteStats,
      selectedRouteName,
      courseSectionId
    );
    console.log("Update was sent");
    console.log(updateData);
  };

  const startTimer = () => {
    const timeInSeconds = timerInputMinutes * 60 + timerInputSeconds;
    socket.emit("startTimer", timeInSeconds);
  };

  const stopTimer = () => {
    socket.emit("stopTimer");
  };

  // Separate effect for drawing based on changes in 'data'
  useEffect(() => {
    if (data) {
      // var dataCopy = data;
      // const shiftAmt = defaultSize.x - 720;
      // Object.keys(dataCopy["regions"]).map((regionName) => {
      //   dataCopy["regions"][regionName]['labelPos'].x += shiftAmt;
      //   if ('camps' in dataCopy["regions"][regionName]) {
      //     dataCopy["regions"][regionName]['campsStatsPos'].x += shiftAmt;
      //     Object.keys(dataCopy["regions"][regionName]['camps']).map((campName) => {
      //       dataCopy["regions"][regionName]['camps'][campName].x += shiftAmt;
      //     });
      //   }
      //   if ('gens' in dataCopy["regions"][regionName]) {
      //     Object.keys(dataCopy["regions"][regionName]['gens']).map((genName) => {
      //       dataCopy["regions"][regionName]['gens'][genName].x += shiftAmt;
      //       dataCopy["regions"][regionName]['gens'][genName]['statsPos'].x += shiftAmt;
      //     });
      //   }
      // });
      // console.log(JSON.stringify(dataCopy));

      // Store the data object in the ref
      dataRef.current = data;
      //selectedCampStatsRef.current = campStats;
      //selectedGenStatsRef.current = genStats;
      campStatsRef.current = campStats;
      genStatsRef.current = genStats;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      // Add event listener for `click` events.
      canvas.addEventListener(
        "click",
        function (event) {
          if (!campStatsRef.current || !genStatsRef || !loggedIn) {
            return;
          }
          // get click position relative to scale of canvas
          const scale = {
            x: (defaultSize.x / canvas.width) * dpr,
            y: (defaultSize.y / canvas.height) * dpr,
          };
          const canvasX = Math.floor(event.offsetX * scale.x);
          const canvasY = Math.floor(event.offsetY * scale.y);
          var clickLoc = { x: canvasX, y: canvasY };
          const data = dataRef.current;
          //handleInput(clickLoc, data, scale)
          if (!data) return;
          const campClickTarget = campSize / 2;

          console.log(JSON.stringify(clickLoc));
          Object.keys(data["regions"]).map((regionName) => {
            const region = data["regions"][regionName];
            if ("gens" in region) {
              // clicking on gen points
              Object.keys(region["gens"]).map((genName) => {
                const gen = region["gens"][genName];
                var radius = genRadius * 1.4;
                if (
                  (clickLoc.x < gen.x + radius && // gen node click
                    clickLoc.x > gen.x - radius &&
                    clickLoc.y < gen.y + radius &&
                    clickLoc.y > gen.y - radius) ||
                  (clickLoc.x > gen["statsPos"].x && // gen stats click
                    clickLoc.x < gen["statsPos"].x + genStatsWidth &&
                    clickLoc.y > gen["statsPos"].y &&
                    clickLoc.y < gen["statsPos"].y + genStatsHeight)
                ) {
                  console.log("clicked on gen " + genName);
                  setActiveTab("refugeeGeneration");
                  setIsPanelOpen(true);

                  setSelectedGenName(genName);
                  setSelectedGenStats(genStatsRef.current[genName]);
                }
              });
            }
            if ("camps" in region) {
              // clicking on camp stats
              if (
                clickLoc.x > region["campsStatsPos"].x &&
                clickLoc.x < region["campsStatsPos"].x + campStatsWidth &&
                clickLoc.y > region["campsStatsPos"].y &&
                clickLoc.y < region["campsStatsPos"].y + campStatsHeight
              ) {
                console.log("clicked on region " + regionName);
                setselectedRegionName(regionName);
                setSelectedCampStats(campStatsRef.current[regionName]);
                console.log(campStatsRef.current[regionName]);
                setActiveTab("camps");
                setIsPanelOpen(true);
              }
              Object.keys(region["camps"]).map((campName) => {
                // clicking on camp nodes
                var node = region["camps"][campName];
                if (
                  clickLoc.x < node.x + campClickTarget &&
                  clickLoc.x > node.x - campClickTarget &&
                  clickLoc.y < node.y + campClickTarget &&
                  clickLoc.y > node.y - campClickTarget
                ) {
                  console.log("clicked on camp " + campName);
                  setselectedRegionName(regionName);
                  setSelectedCampStats(campStatsRef.current[regionName]);
                  console.log(campStatsRef.current[regionName]);
                  setActiveTab("camps");
                  setIsPanelOpen(true);
                }
              });
            }
          });
        },
        false
      );
      draw(ctx, campStats, genStats, routeStats);
    }
  }, [
    data,
    campStats,
    genStats,
    routeStats,
    timerIsActive,
    timerMillisRemaining,
  ]);

  return (
    <div className="mainDiv">
      <div className={`canvas-container ${isPanelOpen ? "sidebar" : ""}`}>
        {/* Add a background image as a CSS background */}

        <div className="canvas-background" />
        <canvas
          data-testid="canvas"
          ref={canvasRef}
          width={defaultSize.x}
          height={defaultSize.y}
        />
      </div>

      {/* Side Panel */}
      {loggedIn && campStats && genStats && routeStats && (
        <div className={`side-panel ${isPanelOpen ? "open" : ""}`}>
          {/* Panel content goes here, include drop down */}

          <div className="side-panel-header">
            <button
              className={`tab-button ${activeTab === "camps" ? "active" : ""}`}
              onClick={() => setActiveTab("camps")}
            >
              Camps
            </button>
            <button
              className={`tab-button ${
                activeTab === "refugeeGeneration" ? "active" : ""
              }`}
              onClick={() => setActiveTab("refugeeGeneration")}
            >
              Generation
            </button>
            <button
              className={`tab-button ${activeTab === "paths" ? "active" : ""}`}
              onClick={() => setActiveTab("paths")}
            >
              Routes
            </button>
            <button
              className={`tab-button ${activeTab === "timer" ? "active" : ""}`}
              onClick={() => setActiveTab("timer")}
            >
              Timer
            </button>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            {/* Content for "Camps" tab */}
            {activeTab === "camps" && campStats && (
              <div className="tab-content">
                <label htmlFor="dropdown">Region</label>
                <select
                  id="dropdown"
                  value={selectedRegionName}
                  onChange={(event) => {
                    setselectedRegionName(event.target.value);
                    setSelectedCampStats(campStats[event.target.value]);
                  }}
                >
                  <option value="1">Region 1</option>
                  <option value="4">Region 4</option>
                  <option value="6">Region 6</option>
                  <option value="7">Region 7</option>
                  <option value="8">Region 8</option>
                  <option value="11">Region 11</option>
                </select>
                <br />
                <br />
                <label htmlFor="fname">Refugees: </label>
                <input
                  type="number"
                  placeholder="Enter refugee number.."
                  value={selectedCampStats.refugeesPresent}
                  onChange={(event) => {
                    setSelectedCampStats((prevStats) => ({
                      ...prevStats,
                      refugeesPresent: event.target.value,
                    }));
                  }}
                />
                <br />
                <br />
                <label htmlFor="fname">Food: </label>
                <input
                  type="number"
                  placeholder="Enter food level.."
                  value={selectedCampStats.food}
                  onChange={(event) => {
                    setSelectedCampStats((prevStats) => ({
                      ...prevStats,
                      food: event.target.value,
                    }));
                  }}
                />
                <br />
                <br />
                <label htmlFor="fname">Health: </label>
                <input
                  type="number"
                  placeholder="Enter health level.."
                  value={selectedCampStats.healthcare}
                  onChange={(event) => {
                    setSelectedCampStats((prevStats) => ({
                      ...prevStats,
                      healthcare: event.target.value,
                    }));
                  }}
                />
                <br />
                <br />
                <label htmlFor="fname">Housing: </label>
                <input
                  type="number"
                  placeholder="Enter housing level.."
                  value={selectedCampStats.housing}
                  onChange={(event) => {
                    setSelectedCampStats((prevStats) => ({
                      ...prevStats,
                      housing: event.target.value,
                    }));
                  }}
                />
                <br />
                <br />
                <label htmlFor="fname">Admin: </label>
                <input
                  type="number"
                  placeholder="Enter admin level.."
                  value={selectedCampStats.admin}
                  onChange={(event) => {
                    setSelectedCampStats((prevStats) => ({
                      ...prevStats,
                      admin: event.target.value,
                    }));
                  }}
                />
                <br />
                <br />
                <button
                  className="borderedd-button-update"
                  onClick={sendCampUpdate}
                >
                  Update
                </button>
                <button
                  className="borderedd-button-revert"
                  onClick={() =>
                    setSelectedCampStats(campStats[selectedRegionName])
                  }
                >
                  Revert
                </button>
              </div>
            )}

            {/* Content for "Refugee Gen" tab */}
            {activeTab === "refugeeGeneration" && genStats && (
              <div className="tab-content">
                <label htmlFor="dropdown">Generation point</label>
                <select
                  id="dropdown"
                  value={selectedGenName}
                  onChange={(event) => {
                    setSelectedGenName(event.target.value);
                    setSelectedGenStats(genStats[event.target.value]);
                  }}
                >
                  <option value="1">Gen 1</option>
                  <option value="2">Gen 2</option>
                  <option value="3">Gen 3</option>
                  <option value="4">Gen 4</option>
                  <option value="5">Gen 5</option>
                  <option value="6">Gen 6</option>
                </select>
                <br />
                <br />
                <label htmlFor="fname">Total Refugees: </label>
                <input
                  type="number"
                  placeholder="Enter Refugees.."
                  value={selectedGenStats.totalRefugees}
                  onChange={(event) => {
                    setSelectedGenStats((prevStats) => ({
                      ...prevStats,
                      totalRefugees: event.target.value,
                    }));
                  }}
                />
                <br />
                <br />
                <label htmlFor="fname">New Refugees: </label>
                <input
                  type="number"
                  placeholder="Enter new refugees.."
                  value={selectedGenStats.newRefugees}
                  onChange={(event) => {
                    setSelectedGenStats((prevStats) => ({
                      ...prevStats,
                      newRefugees: event.target.value,
                    }));
                  }}
                />
                <br />
                <br />
                <label htmlFor="fname">Food: </label>
                <input
                  type="number"
                  placeholder="Enter food level.."
                  value={selectedGenStats.food}
                  onChange={(event) => {
                    setSelectedGenStats((prevStats) => ({
                      ...prevStats,
                      food: event.target.value,
                    }));
                  }}
                />
                <br />
                <br />

                <label htmlFor="fname">Health: </label>
                <input
                  type="number"
                  placeholder="Enter health level.."
                  value={selectedGenStats.healthcare}
                  onChange={(event) => {
                    setSelectedGenStats((prevStats) => ({
                      ...prevStats,
                      healthcare: event.target.value,
                    }));
                  }}
                />
                <br />
                <br />
                <label htmlFor="fname">Admin: </label>
                <input
                  type="number"
                  placeholder="Enter admin level.."
                  value={selectedGenStats.admin}
                  onChange={(event) => {
                    setSelectedGenStats((prevStats) => ({
                      ...prevStats,
                      admin: event.target.value,
                    }));
                  }}
                />
                <label htmlFor="dropdown">Generation Type</label>
                <select
                  id="dropdown"
                  value={selectedGenStats.genType}
                  onChange={(event) => {
                    setSelectedGenStats((prevStats) => ({
                      ...prevStats,
                      genType: event.target.value,
                    }));
                  }}
                >
                  <option value="ORDERLY">Orderly</option>
                  <option value="DISORDERLY">Disorderly</option>
                  <option value="PANIC">Panic</option>
                </select>

                <br />
                <br />
                <button
                  className="borderedd-button-update"
                  onClick={sendGenUpdate}
                >
                  Update
                </button>
                <button
                  className="borderedd-button-revert"
                  onClick={() => setSelectedGenStats(genStats[selectedGenName])}
                >
                  Revert
                </button>
              </div>
            )}

            {/* Content for "Refugee Gen" tab */}
            {activeTab === "paths" && routeStats && data["paths"] && (
              <div className="tab-content">
                <label htmlFor="dropdown">Route</label>
                <select
                  id="dropdown"
                  value={selectedRouteName}
                  onChange={(event) => {
                    setSelectedRouteName(event.target.value);
                    setSelectedRouteStats(routeStats[event.target.value]);
                  }}
                >
                  {Object.keys(data["paths"]).map((route, index) => {
                    return (
                      <option key={index} value={route}>
                        Route {route}
                      </option>
                    );
                  })}
                </select>
                <br />
                <br />
                <label htmlFor="dropdown">Open</label>
                <select
                  id="dropdown"
                  value={selectedRouteStats.isOpen ? "open" : "closed"}
                  onChange={(event) => {
                    setSelectedRouteStats((prevStats) => ({
                      ...prevStats,
                      isOpen: event.target.value === "open",
                    }));
                  }}
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
                <button
                  className="borderedd-button-update"
                  onClick={sendPathUpdate}
                >
                  Update
                </button>
                <button
                  className="borderedd-button-revert"
                  onClick={() =>
                    setSelectedRouteStats(routeStats[selectedRouteName])
                  }
                >
                  Revert
                </button>
              </div>
            )}

            {/* Content for "Timer" tab */}
            {activeTab === "timer" && (
              <div>
                <div className="tab-content">
                  <label>
                    Minutes:
                    <input
                      type="number"
                      value={timerInputMinutes}
                      onChange={(e) =>
                        setTimerInputMinutes(parseInt(e.target.value, 10))
                      }
                      style={{ width: "110px", marginLeft: "2px" }}
                    />
                  </label>
                  <label style={{ marginLeft: "20px" }}>
                    Seconds:
                    <input
                      type="number"
                      value={timerInputSeconds}
                      onChange={(e) =>
                        setTimerInputSeconds(parseInt(e.target.value, 10))
                      }
                      style={{ width: "130px" }}
                    />
                  </label>
                  <br></br>
                  <br></br>
                  {!timerIsActive && (
                    <button
                      className="borderedd-button-timer"
                      onClick={() => startTimer()}
                    >
                      Start Timer
                    </button>
                  )}
                  {timerIsActive && (
                    <button
                      className="borderedd-button-timer-stop"
                      onClick={() => stopTimer()}
                    >
                      Stop Timer
                    </button>
                  )}
                  <br />
                  <br />
                  {/* Buttons for specific times */}
                  {/*
                
                <p className="presets-label">Presets: </p>
                <button className="borderedd-button-timer-preset" onClick={() => {setTimerInputMinutes(1); setTimerInputSeconds(0); startTimer();}}>
                  1 Minute
                </button>
                <button className="borderedd-button-timer-preset" onClick={() => {setTimerInputMinutes(3); setTimerInputSeconds(0); startTimer();}}>
                  3 Minutes
                </button>
                <button className="borderedd-button-timer-preset" onClick={() => {setTimerInputMinutes(5); setTimerInputSeconds(0); startTimer();}}>
                  5 Minutes
                </button>
                <button className="borderedd-button-timer-preset" onClick={() => {setTimerInputMinutes(10); setTimerInputSeconds(0); startTimer();}}>
                  10 Minutes
                </button>
                */}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {loggedIn && (
        <button
          className="bordered-button-admin"
          onClick={handleLogout}
          style={{ position: "fixed", bottom: 7, left: 65 }}
          aria-label="Logout"
        >
          <img src="/logout.png" width="32" height="32"/>
        </button>
      )}
          {loggedIn && (
            
            <div
            className="toggle-panel-icons"
            style={{ position: 'fixed', bottom: '50%', right: 0, cursor: 'pointer' }}
            onClick={togglePanel}
          >
            <FontAwesomeIcon icon={faChevronLeft} className={`text-green-500 text-xl bg-black rounded-full left-[-50px] p-2 ${isPanelOpen ? 'hidden' : ''}`}
                style={{ fontSize: '24px', }}/>
            <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: '24px',
          
                backgroundColor: 'black',
                borderRadius: '50%',
                padding: '10px',
                position: 'fixed',
                right: '300px',
                top: '55%',
                transform: 'translateY(-50%)', }} 
              className={`text-red-500  ${!isPanelOpen ? 'hidden' : ''}`} />
          </div>
        
          )}
      {!loggedIn && (
        <button
          className="bordered-button-admin"
          onClick={() => setShowAdminPopup(true)}
          style={{ position: "fixed", bottom: 7, left: 65 }}
          aria-label="Login"
        >
          <img src="/login-admin.png" width="32" height="32" />
        </button>
      )}
      <Link href="/">
        <button
        className="bordered-button-admin"
        style={{ position: "fixed", bottom: 7, left: 7 }}
        >
        <img src="/home.png" width="32" height="32" />
        </button>
      </Link>

      {/* Admin Popup */}
      {showAdminPopup && (
        <div className="admin-popup">
          <h2>
            <center>Admin Login</center>
          </h2>
          {loginErrorMessage !== "" && (
            <h2 style={{ color: "red" }}>{loginErrorMessage}</h2>
          )}
          <label htmlFor="admin-username">Username:</label>
          <input
            type="text"
            id="admin-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <label htmlFor="admin-password">Password:</label>
          <input
            type="password"
            id="admin-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleLogin}>Login</button>
          <button onClick={() => handleLoginClose()}>Close</button>
        </div>
      )}
    </div>
  );
}

export const getServerSideProps = withSessionSsr(async function ({ req, res }) {
  // verify login data
  if (req.session.user) {
    const username = req.session.user.username;
    const userId = parseInt(req.session.user.userId);

    const token = await new SignJWT({
      username: username,
      userId: userId,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1d")
      .sign(getJwtSecretKey());

    return {
      props: {
        userId,
        username,
        loggedIn: true,
        token,
      },
    };
  } else {
    return {
      props: {
        userId: -1,
        username: "",
        loggedIn: false,
        token: "",
      },
    };
  }
});
