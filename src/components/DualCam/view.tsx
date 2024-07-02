"use client";
import React, { ChangeEvent, useRef } from "react";
import { Dialog, button, select } from "@material-tailwind/react";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import {
  portalGprsCommand,
  vehicleListByClientId,
  videoList,
  vehiclebyClientid,
} from "@/utils/API_CALLS";
import { pictureVideoDataOfVehicleT } from "@/types/videoType";
import Loading from "../../app/loading";
import Image from "next/image";
import Select from "react-select";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import Paper from "@mui/material/Paper";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import TableHead from "@mui/material/TableHead";
import ProgressBar from "./Progressbar";
// import MenuItem from "@mui/material/MenuItem";
import SearchIcon from "@mui/icons-material/Search";
import moment from "moment";
import { DeviceAttach } from "@/types/vehiclelistreports";
import { Toaster, toast } from "react-hot-toast";
import "./newstyle.css";
import { dateTimeToTimestamp, backFromUnix } from "@/utils/unixTimestamp";
import {
  List,
  ListItem,
  ListItemText,
  Collapse,
  RadioGroup,
  Radio,
} from "@material-ui/core";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import DateFnsMomentUtils from "@date-io/date-fns";
import EventIcon from "@material-ui/icons/Event";
import { MaterialUiPickersDate } from "@material-ui/pickers/typings/date";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import { Modal, Backdrop, Fade, IconButton } from "@mui/material";
import Request from "./request";
import Loadcomponent from "./loadcomponent";
import { MuiPickersUtilsProvider, DatePicker } from "@material-ui/pickers";
import { isPagesAPIRouteMatch } from "next/dist/server/future/route-matches/pages-api-route-match";
import Container from "@mui/material/Container";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import { io } from "socket.io-client";
import { setLoginTime } from "@/utils/time";

export default function DualCam() {
  const [pictureVideoDataOfVehicle, setPictureVideoDataOfVehicle] = useState<
    pictureVideoDataOfVehicleT[]
  >([]);
  const { data: session } = useSession();
  const [open, setOpen] = React.useState(false);
  const [openSecond, setOpenSecond] = React.useState(false);
  const [toastId, setToastId] = useState(null);
  const [singleImage, setSingleImage] = useState<any>();
  const [singleVideo, setSingleVideo] = useState<any>();
  const [loading, setLaoding] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageVideo, setCurrentPageVideo] = useState(1);
  const [input, setInput] = useState<any>("");
  const [inputVideo, setInputVideo] = useState<any>("");
  const [activeTab1, setActiveTab1] = useState("View");
  const [filteredDataIsAvaialable, setfilteredDataIsAvaialable] =
    useState<boolean>(true);
  const [open1, setOpen1] = React.useState(false);
  const [openvideo, setopenvideo] = React.useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const [progress, setProgress] = useState<number>(0);
  const [showPopup, setShowPopup] = useState(false);
  const [popupShown, setPopupShown] = useState(false);
  const [deviceCommandText, setDeviceCommandText] = useState<any>([]);
  //  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  //    const value = Number(event.target.value);
  //    if (!isNaN(value) && value >= 0 && value <= 100) {
  //      setProgress(value);
  //    }
  //  };

  // for progress
  const [socketdata, setSocketdata] = useState({
    camera: 0,
    camera_type: "",
    clientId: "",
    deviceDirectory: "",
    filename: "",
    filetype: "",
    metadata_type: 0,
    progress: 0,
    timestamp: null,
    received_packages: 0,
    total_packages: 0,
    vehicle: "",
  });
  const [phundred, setPhundred] = useState(false);
  useEffect(() => {
    // Connect to the server
    const socket = io(
      "http://203.135.34.139:8080/?clientId=64f9c5c3b7f9957d81e36908"
    );
    // Listen for "message" event from the server

    socket.on("message", async (data) => {
      setProgress(Math.floor(data.progress));
      setSocketdata(data);
      if (!popupShown) {
        setPopupShown(true);
        setShowPopup(true);
      }
      if (data.progress === 100) {
        setPopupShown(false);
        setShowPopup(false);

        setTimeout(async () => {
          await fetchVideoListData();
        }, 2000);

        // setPhundred(true);
      }
    });
    // Clean up on unmount

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    // Connect to the server
    const socket = io(
      "https://socketio.vtracksolutions.com:1102/?clientId=64f9c5c3b7f9957d81e36908"
    );
    // Listen for "message" event from the server

    socket.on("device", async (data) => {
      let message;
      if (
        data.commandtext ===
        "Photo request from source 1. Preparing to send file from timestamp 1719846377."
      ) {
        message = "Wait for your file for downloading";
      } else {
        message = "Wait for your file for downloading";
      }
      setDeviceCommandText(data.commandtext);
      console.log("devices+++++++++++++++++++++++++++++++", data);
      // setPhundred(true);
    });
    // Clean up on unmount

    return () => {
      socket.disconnect();
    };
  }, []);
  useEffect(() => {
    if (
      socketdata.filetype === ".h265" &&
      socketdata.progress > 1 &&
      socketdata.progress < 100
    ) {
      if (!toastId) {
        const id: any = toast.loading(`Video Downloading `, {
          position: "top-center",
        });
        setToastId(id);
      }
    } else if (socketdata.progress == 100 && toastId) {
      toast.dismiss(toastId);
      setToastId(null);
    }
  }, [socketdata, toastId]);

  useEffect(() => {
    if (
      socketdata.filetype === ".jpeg" &&
      socketdata.progress > 1 &&
      socketdata.progress < 100
    ) {
      if (!toastId) {
        const id: any = toast.loading(`Image Downloading `, {
          position: "top-center",
        });
        setToastId(id);
      }
    } else if (socketdata.progress == 100 && toastId) {
      toast.dismiss(toastId);
      setToastId(null);
    }
  }, [socketdata, toastId]);

  const fetchVideoListData = async () => {
    try {
      if (session) {
        const response = await videoList({
          token: session?.accessToken,
          clientId: session?.clientId,
        });
        setFilteredRecords(response);
      }
      //  setLaoding(false);
    } catch (error) {
      // selectedVehicle
      console.error("Error fetching  data:", error);
    }
  };

  const handleOpen1 = (item: any) => {
    setOpen1(true);
    setSingleImage(item.path);
  };
  const handleClose = () => {
    setOpen1(false);
    setIsFullScreen(false);
  };
  const handleClosevideo = () => {
    setopenvideo(false);
    setIsFullScreen(false);
  };

  const handleOpenSecond1 = (item: any) => {
    setopenvideo(true);
    setSingleVideo(item.path);
  };
  //   const [disabledButton, setdisabledButton] = useState(true);
  //   const [disabledRequestButton, setdisabledRequestButton] = useState(true);
  // const carData = useRef<VehicleData[]>([]);

  const handleFullScreen = () => {
    setIsFullScreen(true);
    setOpen1(false);
  };
  const handleExitFullScreen = () => {
    setIsFullScreen(false);
    setOpen1(true);
  };
  const style11 = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 1000,
    p: 0,
    zIndex: 1300,
    bgcolor: "black",
  };
  const modalStyles = {
    ...style11,
    width: isFullScreen ? "95%" : "1000px",
    height: isFullScreen ? "95%" : "auto",
    zIndex: 1300,
    position: isFullScreen ? "fixed" : "absolute",
    top: isFullScreen ? "5%" : "50%",
    left: isFullScreen ? "5%" : "50%",
    transform: isFullScreen ? "none" : "translate(-50%, -50%)",
  };
  const handleClick = (tab: string) => {
    setLaoding(true);
    setActiveTab1((prevTab) => (prevTab === tab ? "View" : tab));
  };
  const [CustomDateField, setCustomDateField] = useState(false);
  const [openFrontAndBackCamera, setOpenFrontAndBackCamera] = useState(false);
  const [selectedCameraType, setSelectedCameraType] = useState(null);
  const [mediaType, setMediaType] = useState("images");
  // const [selectedFileType, setSelectedFileType] = useState(null);
  // const [selectedDateFilter, setSelectedDateFilter] = useState(null);
  const [customDate, setCustomDate] = useState(false);
  // const [showDurationTab, setshowDurationTab] = useState(false);
  const sortedRecords = pictureVideoDataOfVehicle.sort(
    (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
  );
  const [selectedVehiclelist, setSelectedVehiclelist] = useState("");
  const [filteredRecords, setFilteredRecords] = useState(sortedRecords);
  const handleVehicleChange1 = (e: any) => {
    const selectedVehicleId = e;
    setSelectedVehiclelist(selectedVehicleId);
    if (selectedVehicleId === "" || selectedVehicleId === null) {
      if (fromDate && toDate !== null) {
        const fromDateString = (fromDate as any)?.toISOString().split("T")[0];
        const toDateString = (toDate as any)?.toISOString().split("T")[0];
        const filteredWithDate = sortedRecords.filter((record) => {
          const recordDate = (record.dateTime as any).split("T")[0];
          return recordDate >= fromDateString && recordDate <= toDateString;
        });
        setCurrentPage(1);
        setCurrentPageVideo(1);
        setFilteredRecords(filteredWithDate);
        setfilteredDataIsAvaialable(true);
      } else {
        setCurrentPage(1);
        setCurrentPageVideo(1);
        setfilteredDataIsAvaialable(true);
        setFilteredRecords(sortedRecords);
      }
    } else {
      const filtered = sortedRecords.filter(
        (record) => record.Vehicle === selectedVehicleId?.value
      );
      const fromDateString = (fromDate as any)?.toISOString().split("T")[0];
      const toDateString = (toDate as any)?.toISOString().split("T")[0];
      const filteredWithDate = filtered.filter((record) => {
        const recordDate = (record.dateTime as any).split("T")[0];
        return recordDate >= fromDateString && recordDate <= toDateString;
      });
      if (filtered.length !== 0) {
        if (fromDate && toDate !== null) {
          setCurrentPage(1);
          setCurrentPageVideo(1);
          setFilteredRecords(filteredWithDate);
          setfilteredDataIsAvaialable(true);
        } else {
          setCurrentPage(1);
          setCurrentPageVideo(1);
          setfilteredDataIsAvaialable(true);
          setFilteredRecords(filtered);
        }
      } else {
        toast("no records found");
        setfilteredDataIsAvaialable(false);
        const filtered = sortedRecords.filter(
          (record) => record.Vehicle === selectedVehicleId?.value
        );
        setFilteredRecords(filtered);
        setCurrentPage(1);
        setCurrentPageVideo(1);
      }
    }
  };
  //here code:
  // const [currentPage1, setCurrentPage1] = useState(1);
  const [inputValue, setInputValue] = useState("");
  // const handleChangePage = (event: React.ChangeEvent<unknown>, value: number) => {
  //   setCurrentPage1(value);
  // };

  const handleClickGo = () => {
    const pageNumber = parseInt(inputValue);
    if (!isNaN(pageNumber) && pageNumber > 0 && pageNumber <= totalCountVideo) {
      <Pagination />;
      setCurrentPage(pageNumber);
      setCurrentPageVideo(pageNumber);
      setInputValue("");
    }
  };

  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  //  const [selectedFromDate, setSelectedFromDate] = useState('');
  // const [selectedToDate, setSelectedToDate] = useState('');

  const handleDateChange1 = (
    type: string,
    date: MaterialUiPickersDate | null
  ) => {
    if (date !== null) {
      const dateValue = moment(date).toDate();
      if (type === "from") {
        setFromDate(dateValue);
      } else if (type === "to") {
        setToDate(dateValue);
      }
    }
  };
  const handleSearch1 = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    // setCurrentPage1(1);
    setCurrentPage(1);
    if (fromDate && toDate) {
      const fromDateString = (fromDate as any).toISOString().split("T")[0];
      const toDateString = (toDate as any).toISOString().split("T")[0];
      const filtered = sortedRecords.filter((record) => {
        const recordDate = (record.dateTime as any).split("T")[0];
        return recordDate >= fromDateString && recordDate <= toDateString;
      });
      if (selectedVehiclelist === null || selectedVehiclelist === "") {
        setFilteredRecords(filtered);
      } else {
        const filteredWithVehicle = filtered.filter(
          (record) => record.Vehicle === selectedVehiclelist?.value
        );
        setFilteredRecords(filteredWithVehicle);
        setCurrentPage(1);
        if (filteredWithVehicle.length === 0) {
          setfilteredDataIsAvaialable(false);
        }
      }
    } else {
      setFilteredRecords(sortedRecords);
    }
  };
  const handleClear = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    if (selectedVehiclelist === "" || selectedVehiclelist === null) {
      setFilteredRecords(sortedRecords);
    } else {
      const filtered = sortedRecords.filter(
        (record) => record.Vehicle === selectedVehiclelist?.value
      );
      setFilteredRecords(filtered);
    }
    setFromDate(null);
    setToDate(null);
  };
  // useEffect(() => {
  //   // Set filtered records when the component mounts
  //   setFilteredRecords(sortedRecords);
  // }, []);

  const recordsPerPage = 8;
  const lastIndex = currentPage * recordsPerPage;
  const firstIndex = lastIndex - recordsPerPage;
  const fileType1Records = filteredRecords.filter(
    (record) => record.fileType === 1
  );
  // const records = pictureVideoDataOfVehicle.slice(firstIndex, lastIndex);
  const records = fileType1Records.slice(firstIndex, lastIndex);
  const totalCount: any = Math.ceil(fileType1Records.length / recordsPerPage);
  const recordsPerPageVideo = 8;
  const lastIndexVideo = currentPageVideo * recordsPerPageVideo;
  const firstIndexVideo = lastIndexVideo - recordsPerPageVideo;
  const fileType2Records = filteredRecords.filter(
    (record) => record.fileType === 2
  );
  const recordsVideo = fileType2Records.slice(firstIndexVideo, lastIndexVideo);
  const totalCountVideo: any = Math.ceil(
    fileType2Records.length / recordsPerPageVideo
  );
  const [vehicleList, setVehicleList] = useState<DeviceAttach[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<DeviceAttach | null>(
    null
  );
  const handleChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
    // setCurrentPage1(value);
  };
  const currenTDates = new Date();
  const isCurrentDate = (date: any) => {
    if (date instanceof Date) {
      const currentDate = new Date();
      return (
        date.getDate() === currentDate.getDate() &&
        date.getMonth() === currentDate.getMonth() &&
        date.getFullYear() === currentDate.getFullYear()
      );
    }
    return false;
  };
  // const [selectedDate, setSelectedDate] =  useState<Date | null>(null);
  // const [selectedTime, setSelectedTime] = useState('');
  // const [selectedduration, setSelectedDuration] = useState('');
  const handleChangeVideo = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setCurrentPageVideo(value);
  };
  const handleClickPagination = () => {
    const pageNumber = parseInt(input, 10);
    if (!isNaN(pageNumber) && pageNumber > 0 && pageNumber <= totalCount) {
      <Pagination />;
      setCurrentPage(input);
      // setCurrentPage1(input)
    }
  };

  // const handleClickPaginationVideo = () => {
  //   const pageNumber = parseInt(inputVideo, 10);
  //   if (!isNaN(pageNumber) && pageNumber > 0 && pageNumber <= totalCount) {
  //     setCurrentPageVideo(inputVideo);
  //   }
  // };
  const handleOpen = (item: any) => {
    setOpen(!open);
    setSingleImage(item.path);
  };
  const handleDownload = (item: any) => {
    window.location.href = item.path;
  };

  const handleOpenSecond = (item: any) => {
    setOpenSecond(!openSecond);
    setSingleVideo(item.path);
  };

  const formatUnixTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000); // Convert seconds to milliseconds
    return date.toLocaleString(); // Format date as a string
  };

  useEffect(() => {
    const vehicleListData = async () => {
      try {
        if (session?.userRole == "Admin" || session?.userRole == "Controller") {
          const Data = await vehicleListByClientId({
            token: session.accessToken,
            clientId: session?.clientId,
          });
          setVehicleList(Data.data);
        }
      } catch (error) {
        console.error("Error fetching zone data:", error);
      }
    };
    vehicleListData();
  }, []);
  const hasRunRef = useRef(false);

  useEffect(() => {
    const vehicleListData = async () => {
      try {
        if (session) {
          const response = await videoList({
            token: session?.accessToken,
            clientId: session?.clientId,
          });
          setPictureVideoDataOfVehicle(response);
          setFilteredRecords(response);
        }
        //  setLaoding(false);
      } catch (error) {
        // selectedVehicle
        console.error("Error fetching  data:", error);
      }
    };

    vehicleListData();
  }, [session, phundred]);

  // here add extra
  // const fetchVehicleList = async () => {
  //     try {
  //       if (session) {
  //         const response = await videoList({
  //           token: session?.accessToken,
  //           clientId: session?.clientId,
  //         });
  //         // setPictureVideoDataOfVehicle(response);
  //         // setFilteredRecords(response);
  //         setVehicleList(response.data);
  //       }
  //     } catch (error) {
  //       console.error('Error fetching vehicle data:', error);
  //     }
  //   };

  //   useEffect(() => {
  //     if ((progress > 0 && !hasRunRef.current) || progress === 100) {
  //       fetchVehicleList();
  //       hasRunRef.current = true;
  //     }
  //     if (progress === 0) {
  //       hasRunRef.current = false;
  //     }
  //   }, [progress, session]);

  const handleCustom = () => {
    setCustomDate(true);
  };
  const handleWeekend = () => {
    setCustomDate(false);
  };
  const handleClickCustom = () => {
    setCustomDateField(!CustomDateField);
  };

  //   const handleSelectChange = (e: any) => {
  //     const selectedVehicleId = e;
  //     const selectedVehicle = vehicleList.find(vehicle => vehicle.vehicleReg === selectedVehicleId?.value);
  //    setSelectedVehicle(selectedVehicle || null);
  //   };
  // const options =
  // vehicleList.map((item: any) => ({
  //   value: item.vehicleReg,
  //   label: item.vehicleReg,
  // })) || [];

  const options2 =
    vehicleList.map((item: any) => ({
      value: item.vehicleReg,
      label: item.vehicleReg,
    })) || [];

  //   const handleCameraTypeChange = (event: { target: { value: any; }; }) => {
  //     setSelectedCameraType(event.target.value);
  //   };
  //   const handleFileTypeChange =  (event: { target: { value: any; }; }) => {
  //     let filetype = event.target.value
  //     setSelectedFileType(filetype);
  //     if(filetype === "Video"){
  //     setshowDurationTab(true)}
  //     else {
  //       setshowDurationTab(false)
  //     }
  //   };
  // here camera on code:
  // useEffect(() => {
  //   (async function () {
  //     if (session?.clientId) {
  //       const clientVehicleData = await getVehicleDataByClientId(
  //         session?.clientId
  //       );
  //       if (clientVehicleData?.data?.Value) {
  //         let parsedData = JSON.parse(
  //           clientVehicleData?.data?.Value
  //         )?.cacheList;
  //         // call a filter function here to filter by IMEI and latest time stamp
  //         let uniqueData = uniqueDataByIMEIAndLatestTimestamp(parsedData);
  //        carData.current = uniqueData;
  //        if(carData.current){
  //         const foundVehicle = carData.current.find((vehicle: { vehicleReg: string; }) => vehicle.vehicleReg === selectedVehicle?.vehicleReg);
  //         setdisabledButton(true)
  //         setdisabledRequestButton(false)
  //       }
  //       else if (foundVehicle?.frontCamera.value == 0 && foundVehicle?.backCamera.value == 0 ) {
  //         setdisabledButton(false)
  //         setdisabledRequestButton(true)
  //       }
  //       else {
  //         setdisabledButton(true)
  //         setdisabledRequestButton(true)
  //       }
  //      //   setdisabledButton()
  //        }
  //       }
  //  }
  //   })();
  // }, [ session, selectedVehicle]);
  //   const handlecameraOn = async () =>{

  //     let duration = 500
  //     let formvalues = {
  //       commandtext: `setdigout 1 ${duration}` ,
  //       vehicleReg: selectedVehicle?.vehicleReg,
  //       command : "",
  //         createdDate: "",
  //         modifyDate: "",
  //         parameter: "",
  //         deviceIMEI: "",
  //         status: "Pending",
  //     }
  //     if (selectedVehicle == null){
  //       return toast.error("Please select vehicle")
  //     }
  //     if (session ){
  //     const response = await toast.promise(
  //       portalGprsCommand({
  //         token: session?.accessToken, payload: formvalues
  //       }),
  //       {
  //         loading: "Saving data...",
  //         success: "Data saved successfully!",
  //         error: "Error saving data. Please try again.",
  //       },
  //       {
  //         style: {
  //           border: "1px solid #00B56C",
  //           padding: "16px",
  //           color: "#1A202C",
  //         },
  //         success: {
  //           duration: 2000,
  //           iconTheme: {
  //             primary: "#00B56C",
  //             secondary: "#FFFAEE",
  //           },
  //         },
  //         error: {
  //           duration: 2000,
  //           iconTheme: {
  //             primary: "#00B56C",
  //             secondary: "#FFFAEE",
  //           },
  //         },
  //       }
  //     );

  //   }
  //   }
  useEffect(() => {
    // fetchData(mediaType);
    const timeoutId = setTimeout(() => {
      setLaoding(false);
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [recordsVideo, records]);

  // useEffect(() => {
  //   if(progress > 99){
  //     const vehicleListData = async () => {
  //       try {
  //         if (session) {
  //           const response = await videoList({
  //             token: session?.accessToken,
  //             clientId: session?.clientId,
  //           });
  //           setPictureVideoDataOfVehicle(response);
  //           setFilteredRecords(response);
  //         }
  //       } catch (error) {
  //         console.error("Error fetching data:", error);
  //       }
  //     };
  //     vehicleListData();
  //   }
  //   // setLaoding(true)
  // }, [progress])
  // }, [mediaType]);

  // }, [mediaType]);

  const handleMediaType = (event: { target: { value: any } }) => {
    // setLaoding(true);
    setCurrentPage(1);
    // setCurrentPage1(1);
    setCurrentPageVideo(1);
    setMediaType(event.target.value);
  };

  //   const handleDateFilterChange = (event: { target: { value: any; }; }) => {
  //     const selectedValue = event.target.value;
  //     setSelectedDateFilter(selectedValue);
  //     if (selectedValue === "custom") {
  //       setCustomDate(true);
  //     } else {
  //       setCustomDate(false);
  //     }
  //   };

  //   const handleSubmit = async () => {
  //     const selectedValues = {
  //       vehicle: selectedVehicle,
  //       cameraType: selectedCameraType,
  //       fileType: selectedFileType,
  //       dateFilter: selectedDateFilter,
  //     };
  //     const dateTime = {
  //       date: selectedDate || new Date(),
  //       time: selectedTime ,
  //     };
  //     const timestamp = dateTimeToTimestamp(dateTime.date.toISOString(), selectedTime);
  //     let Duration;
  //     if(Number(selectedduration) <= 10) {
  //        Duration = selectedduration
  //     }
  //     else {
  //       return toast.error("Please enter duration between 1-10 seconds")
  //     }
  //     let commandText;
  //     if( selectedFileType === "Photo") {
  //       if(selectedCameraType === "Front"){
  //         commandText = "camreq: 1,1"
  //       }
  //       else if (selectedCameraType === "Back"){
  //         commandText = "camreq: 1,2"
  //       }
  //     }
  //     else if (selectedFileType === "Video" ) {
  //       if(selectedCameraType === "Front"){
  //         commandText = `camreq: 0,1,${timestamp},${Duration}`
  //       }
  //       else if (selectedCameraType === "Back"){
  //         commandText = `camreq: 0,2,${timestamp},${Duration}`
  //       }
  //     }
  //     let formvalues = {
  //       command : "",
  //       commandtext: commandText,
  //       createdDate: "",
  //       modifyDate: "",
  //       parameter: "",
  //       deviceIMEI: "",
  //       status: "Pending",
  //       vehicleReg: selectedVehicle?.vehicleReg
  //     }
  //     if (session) {
  //     const response = await toast.promise(
  //       portalGprsCommand({
  //         token: session?.accessToken, payload: formvalues
  //       }),
  //       {
  //         loading: "Saving data...",
  //         success: "Data saved successfully!",
  //         error: "Error saving data. Please try again.",
  //       },
  //       {
  //         style: {
  //           border: "1px solid #00B56C",
  //           padding: "16px",
  //           color: "#1A202C",
  //         },
  //         success: {
  //           duration: 2000,
  //           iconTheme: {
  //             primary: "#00B56C",
  //             secondary: "#FFFAEE",
  //           },
  //         },
  //         error: {
  //           duration: 2000,
  //           iconTheme: {
  //             primary: "#00B56C",
  //             secondary: "#FFFAEE",
  //           },
  //         },
  //       }
  //     );
  //     if (response.success) {
  //       setSelectedVehicle(null)
  //       setSelectedFileType(null)
  //       setSelectedCameraType(null)
  //       setSelectedDuration('')
  //       setSelectedTime('')
  //       setSelectedDate(null)
  //       //   // Additional logic for success
  //        }

  //     }
  //     // Perform any further actions, such as sending the selected values to the server
  //   };

  // get video indexing issue
  // const [getVideoPagination, setVideoPagination] = useState<any>([]);
  // useEffect(() => {
  //   const func = async () => {
  //     const data = await pictureVideoDataOfVehicle.map((item) => {
  //       if (item.fileType == 2) {
  //         return item.Vehicle;
  //       }
  //     });
  //     setVideoPagination(data);
  //   };
  //   func();
  // }, []);

  // suraksha
  // const sortedRecords = records.filter(item => item.fileType === 1)
  // .slice()
  // .sort((a, b) => {
  //   const dateA = new Date(a.dateTime);
  //   const dateB = new Date(b.dateTime);
  //   return dateB.getTime() - dateA.getTime();
  // });
  // Assuming records contain all the data

  return (
    <div>
      <hr className="text-white"></hr>
      <p className="bg-green px-4 py-1 text-white mb-5 font-bold text-center">
        View Image & Videos
      </p>
      <div>
        {showPopup && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-white p-6 rounded shadow-lg relative">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                onClick={() => {
                  setPopupShown(false);
                  setShowPopup(false);
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              {/* <p className="text-center">
                {socketdata.filetype === ".jpeg" &&
                  "Image Downloading is in progress"}
                {socketdata.filetype === ".h265" && toast.success("Dawnlaoding Video",{
                  position:"top-center"
                })}
              </p> */}
            </div>
          </div>
        )}
      </div>

      {/* here add collapse */}
      <List
        component="nav"
        className="nav nav-tabs  nav nav-pills bg-nav-pills "
      >
        <ListItem
          button
          onClick={() => handleClick("Request")}
          selected={activeTab1 === "Request"}
          style={{
            color: "white",
            border: "1px solid green",
            background: "#00b56c",
            marginBottom: "1px",
          }}
        >
          <ListItemText
            primary="Request Camera"
            style={{ fontWeight: "900" }}
          />
          {activeTab1 === "Request" ? (
            <ExpandLessIcon style={{ width: "24px", height: "24px" }} />
          ) : (
            <ExpandMoreIcon style={{ width: "24px", height: "24px" }} />
          )}
        </ListItem>
        <Collapse in={activeTab1 === "Request"} timeout="auto">
          <div>
            <Request
              socketdata={socketdata}
              deviceCommandText={deviceCommandText}
            />
          </div>
          <br></br>
        </Collapse>

        <ListItem
          button
          onClick={() => handleClick("View")}
          selected={activeTab1 === "View"}
          style={{
            color: "white",
            border: "1px solid green",
            background: "#00b56c",
          }}
        >
          <ListItemText primary="View Camera" style={{ fontWeight: "900" }} />
          {activeTab1 === "View" ? (
            <ExpandLessIcon style={{ width: "24px", height: "24px" }} />
          ) : (
            <ExpandMoreIcon style={{ width: "24px", height: "24px" }} />
          )}
        </ListItem>

        <Collapse in={activeTab1 === "View"} timeout="auto">
          <div className="tab-pane" id="">
            {openFrontAndBackCamera ? (
              <div>
                <div className="grid lg:grid-cols-6 text-center mt-5  ">
                  <div className="col-span-1">
                    <p>Vehicle:</p>
                  </div>
                  <div className="col-span-1">
                    <p>Date:</p>
                  </div>
                  <div className="col-span-1">
                    <p>Camera Type:</p>
                  </div>
                </div>

                <div
                  className="grid lg:grid-cols-8  sm:grid-cols-5 md:grid-cols-5 grid-cols-1 mt-5 "
                  style={{
                    display: "block",
                    justifyContent: "center",
                  }}
                >
                  <div className="lg:col-span-4  md:col-span-4  sm:col-span-5 col-span-4  ">
                    {loading ? (
                      <Loading />
                    ) : (
                      <div className="grid grid-cols-12  gap-6 mx-4 ">
                        <div
                          className="col-span-3 w-full shadow-lg "
                          // style={{ height: "34em" }}
                        >
                          <p>Front Camera:</p>

                          <div className="bg-green shadow-lg sticky top-0">
                            <h1 className="text-center text-5xl text-white font-serif pt-3 ">
                              Image
                            </h1>
                            <hr className="w-36 ms-auto mr-auto pb-5 text-white"></hr>
                          </div>
                          <div
                            className="grid grid-cols-6 text-center pt-5"
                            //  style={{borderBottom: "1px solid green"}}
                          >
                            <div className="col-span-1">
                              <p className="font-bold text-sm">S.No</p>
                            </div>
                            <div className="col-span-1">
                              <p className="font-bold text-sm">Vehicle.No</p>
                            </div>
                            <div className="col-span-2 ">
                              <p className="font-bold text-sm ">
                                Date and Time
                              </p>
                            </div>
                            <div className="col-span-2 ms-6">
                              <p className="font-bold text-sm -ms-5">Action</p>
                            </div>
                          </div>
                          {records.map(
                            (item: pictureVideoDataOfVehicleT, index) => {
                              if (item.fileType === 1) {
                                return (
                                  <div
                                    className="grid grid-cols-6 text-center pt-5"
                                    key={index}
                                  >
                                    <div className="col-span-1 mt-2">
                                      <p className="text-sm">{index + 1}</p>
                                    </div>
                                    <div className="col-span-1 mt-2">
                                      <p className="text-sm">{item.Vehicle}</p>
                                    </div>
                                    <div className="col-span-2">
                                      <p className="text-sm mt-2">
                                        {new Date(
                                          item?.dateTime
                                        ).toLocaleString("en-US", {
                                          timeZone: session?.timezone,
                                        })}
                                      </p>
                                    </div>
                                    <div className="col-span-2">
                                      <button
                                        onClick={() => {
                                          handleOpen(item);
                                        }}
                                        className="text-white bg-green py-2 px-5 "
                                      >
                                        Image
                                      </button>
                                    </div>
                                  </div>
                                );
                              }
                            }
                          )}

                          <div className="flex  justify-center mt-8 ">
                            <div className="grid lg:grid-cols-5 my-4 ">
                              <div className="col-span-1">
                                <p className="mt-1 text-labelColor text-start text-sm">
                                  Total {pictureVideoDataOfVehicle.length} item
                                </p>
                              </div>

                              <div className="col-span-3 ">
                                <Stack spacing={2}>
                                  <Pagination
                                    count={totalCount}
                                    page={currentPage}
                                    onChange={handleChange}
                                    className="text-sm "
                                    siblingCount={-totalCount}
                                  />
                                </Stack>
                              </div>
                              <div className="col-lg-1 mt-1">
                                <input
                                  type="text"
                                  className="w-8 border border-grayLight outline-green mx-2 px-1"
                                  onChange={(e: any) =>
                                    setInput(e.target.value)
                                  }
                                />
                                <span
                                  className="text-labelColor text-sm cursor-pointer"
                                  onClick={handleClickPagination}
                                >
                                  <span className="text-sm">Page</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Dialog
                          open={open}
                          handler={handleOpen}
                          className="w-3/6 ms-auto mr-auto bg-bgLight"
                          placeholder=""
                        >
                          <Image
                            src={singleImage}
                            width="1000"
                            height="100"
                            style={{
                              height: "100vh",
                              transform: "rotate(180deg)",
                            }}
                            alt="Image"
                          />
                        </Dialog>
                        <div
                          className="col-span-3 shadow-lg w-full lg:-ms-4 "
                          // style={{ height: "auto" }}
                        >
                          <p className="text-white">.</p>
                          <div className="bg-green shadow-lg sticky top-0">
                            <h1 className="text-center text-5xl text-white font-serif pt-3 ">
                              Video
                            </h1>
                            <hr className="w-36 ms-auto mr-auto pb-5 text-white"></hr>
                          </div>
                          <div className="grid grid-cols-6 text-center pt-5">
                            <div className="col-span-1">
                              <p className="font-bold text-sm">S.No</p>
                            </div>
                            <div className="col-span-1">
                              <p className="font-bold text-sm">Vehicle.No</p>
                            </div>
                            <div className="col-span-2">
                              <p className="font-bold text-sm">Date and Time</p>
                            </div>
                            <div className="col-span-2">
                              <p className="font-bold text-sm ">Action</p>
                            </div>
                          </div>
                          {recordsVideo.map(
                            (item: pictureVideoDataOfVehicleT, index) => {
                              if (item.fileType === 2) {
                                return (
                                  <div key={index}>
                                    <div className="grid grid-cols-6 text-center pt-5">
                                      <div className="col-span-1 mt-2">
                                        <p>{index + 1}</p>
                                        <p>suraksha</p>
                                      </div>
                                      <div className="col-span-1">
                                        <p className="text-sm mt-2">
                                          {item.Vehicle}
                                        </p>
                                      </div>
                                      {/* <div className="col-span-2">
                                  <p className="text-sm mt-2">
                                    {new Date(item?.dateTime).toLocaleString(
                                      "en-US",
                                      {
                                        timeZone: session?.timezone,
                                      }
                                    )}
                                  </p>
                                </div> */}
                                      <div className="col-span-2">
                                        <p className="text-sm mt-2">
                                          {new Date(
                                            item?.dateTime
                                          ).toLocaleString("en-US", {
                                            timeZone: session?.timezone,
                                          })}
                                        </p>
                                      </div>
                                      <div className="col-span-2">
                                        <button
                                          onClick={() => handleOpenSecond(item)}
                                          className="text-white bg-green py-2 px-5 "
                                        >
                                          Video
                                        </button>
                                        <Dialog
                                          open={openSecond}
                                          handler={handleOpenSecond}
                                          className="w-3/6 ms-auto mr-auto bg-bgLight"
                                          placeholder=""
                                        >
                                          <video
                                            muted
                                            loop
                                            autoPlay
                                            src={singleVideo}
                                            className="h-screen"
                                          ></video>
                                        </Dialog>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                            }
                          )}

                          <div className="flex  justify-center mt-8 ">
                            <div className="grid lg:grid-cols-5 my-4">
                              <div className="col-span-1">
                                <p className="mt-1 text-labelColor text-end text-sm">
                                  Total {recordsVideo.length} item
                                </p>
                              </div>

                              {/* <div className="col-span-3 ">
                          <Stack spacing={2}>
                            <Pagination
                              count={totalCountVideo}
                              page={currentPageVideo}
                              onChange={handleChangeVideo}
                              siblingCount={-totalCountVideo}
                              className="text-sm"
                            />
                          </Stack>
                        </div> */}
                              {/* <div className="col-lg-1 mt-1">
                  
                          <input
                            type="text"
                            className="w-8 border border-grayLight outline-green mx-2 px-1"
                            onChange={(e: any) => setInputVideo(e.target.value)}
                          />
                          <span
                            className="text-labelColor text-sm cursor-pointer"
                            onClick={handleClickPaginationVideo}
                          >
                            page &nbsp;&nbsp;
                          </span>
                        </div> */}
                            </div>
                          </div>
                        </div>
                        {/* second part */}

                        <div
                          className="col-span-3 w-full shadow-lg "
                          // style={{ height: "34em" }}
                        >
                          <p>Back Camera:</p>
                          <div className="bg-green shadow-lg sticky top-0">
                            <h1 className="text-center text-5xl text-white font-serif pt-3 ">
                              Image
                            </h1>
                            <hr className="w-36 ms-auto mr-auto pb-5 text-white"></hr>
                          </div>
                          <div className="grid grid-cols-6 text-center pt-5">
                            <div className="col-span-1">
                              <p className="font-bold text-sm">S.No</p>
                            </div>
                            <div className="col-span-1">
                              <p className="font-bold text-sm">Vehicle.No</p>
                            </div>
                            <div className="col-span-2 ">
                              <p className="font-bold text-sm ">
                                Date and Time
                              </p>
                            </div>
                            <div className="col-span-2 ">
                              <p className="font-bold text-sm ">Action</p>
                            </div>
                          </div>
                          {records.map(
                            (item: pictureVideoDataOfVehicleT, index) => {
                              if (item.fileType === 1) {
                                return (
                                  <div
                                    className="grid grid-cols-6 text-center pt-5"
                                    key={index}
                                  >
                                    <div className="col-span-1 mt-2">
                                      <p className="text-sm">{index + 1}</p>
                                    </div>
                                    <div className="col-span-1 mt-2">
                                      <p className="text-sm">{item.Vehicle}</p>
                                    </div>
                                    <div className="col-span-2">
                                      <p className="text-sm mt-2">
                                        {new Date(
                                          item?.dateTime
                                        ).toLocaleString("en-US", {
                                          timeZone: session?.timezone,
                                        })}
                                      </p>
                                    </div>
                                    <div className="col-span-2">
                                      <button
                                        onClick={() => {
                                          handleOpen(item);
                                        }}
                                        className="text-white bg-green py-2 px-5 "
                                      >
                                        Image
                                      </button>
                                    </div>
                                  </div>
                                );
                              }
                            }
                          )}

                          <div
                            className="flex  justify-end mt-8 "
                            // style={{ position: "fixed", bottom: "1%" }}
                          >
                            <div className="grid lg:grid-cols-5 my-4 ">
                              <div className="col-span-1">
                                <p className="mt-1 text-labelColor text-start text-sm">
                                  Total {pictureVideoDataOfVehicle.length} item
                                </p>
                              </div>

                              <div className="col-span-3 ">
                                <Stack spacing={2}>
                                  <Pagination
                                    count={totalCount}
                                    page={currentPage}
                                    onChange={handleChange}
                                    siblingCount={-totalCount}
                                    className="text-sm "
                                  />
                                </Stack>
                              </div>
                              <div className="col-lg-1 mt-1">
                                <input
                                  type="text"
                                  className="w-8 border border-grayLight outline-green mx-1 px-1"
                                  onChange={(e: any) =>
                                    setInput(e.target.value)
                                  }
                                />
                                <span
                                  className="text-labelColor text-sm cursor-pointer"
                                  onClick={handleClickPagination}
                                >
                                  <span className="text-sm"> Page</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Dialog
                          open={open}
                          handler={handleOpen}
                          className="w-3/6 ms-auto mr-auto bg-bgLight"
                          placeholder=""
                        >
                          <Image
                            src={singleImage}
                            width="1000"
                            height="100"
                            style={{
                              height: "100vh",
                            }}
                            alt="Image"
                          />
                        </Dialog>
                        <div
                          className="col-span-3 shadow-lg w-full lg:-ms-4  "
                          // style={{ height: "auto" }}
                        >
                          <p className="text-white">.</p>
                          <div className="bg-green shadow-lg sticky top-0">
                            <h1 className="text-center text-5xl text-white font-serif pt-3 ">
                              Video
                            </h1>
                            <hr className="w-36 ms-auto mr-auto pb-5 text-white"></hr>
                          </div>
                          <div className="grid grid-cols-6 text-center pt-5">
                            <div className="col-span-1">
                              <p className="font-bold text-sm">S.No</p>
                            </div>
                            <div className="col-span-1">
                              <p className="font-bold text-sm">Car.No</p>
                            </div>
                            <div className="col-span-2">
                              <p className="font-bold text-sm">Date</p>
                            </div>
                            <div className="col-span-2">
                              <p className="font-bold text-sm ">Check</p>
                            </div>
                          </div>
                          {recordsVideo.map(
                            (item: pictureVideoDataOfVehicleT, index) => {
                              if (item.fileType === 2) {
                                return (
                                  <div key={index}>
                                    <div className="grid grid-cols-6 text-center pt-5">
                                      <div className="col-span-1 mt-2">
                                        <p>{index + 1}</p>
                                      </div>
                                      <div className="col-span-1">
                                        <p className="text-sm mt-2">
                                          {item.Vehicle}
                                        </p>
                                      </div>
                                      <div className="col-span-2">
                                        <p className="text-sm mt-2">
                                          {new Date(
                                            item?.dateTime
                                          ).toLocaleString("en-US", {
                                            timeZone: session?.timezone,
                                          })}
                                        </p>
                                      </div>
                                      <div className="col-span-2">
                                        <button
                                          onClick={() => handleOpenSecond(item)}
                                          className="text-white bg-green py-2 px-5 "
                                        >
                                          Video
                                        </button>
                                        <Dialog
                                          open={openSecond}
                                          handler={handleOpenSecond}
                                          className="w-3/6 ms-auto mr-auto bg-bgLight"
                                          placeholder=""
                                        >
                                          <video
                                            muted
                                            loop
                                            autoPlay
                                            src={singleVideo}
                                            className="h-screen"
                                          ></video>
                                        </Dialog>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                            }
                          )}

                          <div className="flex  justify-end mt-8 ">
                            <div className="grid lg:grid-cols-5 my-4">
                              <div className="col-span-1">
                                <p className="mt-1 text-labelColor text-end text-sm">
                                  Total {recordsVideo.length} item
                                </p>
                              </div>

                              {/* <div className="col-span-3 ">
                          <Stack spacing={2}>
                            <Pagination
                              count={totalCountVideo}
                              page={currentPageVideo}
                              onChange={handleChangeVideo}
                              siblingCount={-totalCountVideo}
                              className="text-sm"
                            />
                          </Stack>
                        </div> */}
                              <div className="col-lg-1 mt-1">
                                {/* <span className="text-sm">Go To</span> */}
                                {/* <input
                            type="text"
                            className="w-8 border border-grayLight outline-green mx-2 px-1"
                            onChange={(e: any) => setInputVideo(e.target.value)}
                          />
                          <span
                            className="text-labelColor text-sm cursor-pointer"
                            onClick={handleClickPaginationVideo}
                          >
                            page &nbsp;&nbsp;
                          </span> */}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="grid lg:grid-cols-6  mt-5  ">
                  <div
                    className="col-span-1 gap-2 "
                    style={{ marginRight: "50px", marginLeft: "20px" }}
                  >
                    {/* <select 
  className="rounded-md w-3/4 outline-green border border-grayLight hover:border-green css-b62m3t-container pt-2 pb-2"
  onChange={handleVehicleChange1}
>
  <option value="">Select a vehicle</option>
  {vehicleList.map(vehicle => (
    <option key={vehicle.id} value={vehicle.vehicleReg}>{vehicle.vehicleReg}</option>
  ))}
</select> */}
                    <Select
                      // value={Ignitionreport}
                      onChange={handleVehicleChange1}
                      options={options2}
                      placeholder="Pick Vehicle"
                      isClearable
                      isSearchable
                      noOptionsMessage={() => "No options available"}
                      className="rounded-md w-full  outline-green border border-grayLight  hover:border-green select_vehicle"
                      styles={{
                        control: (provided, state) => ({
                          ...provided,
                          border: "none",
                          boxShadow: state.isFocused ? null : null,
                        }),
                        option: (provided, state) => ({
                          ...provided,
                          backgroundColor: state.isSelected
                            ? "#00B56C"
                            : state.isFocused
                            ? "#E1F0E3"
                            : "transparent",
                          color: state.isSelected
                            ? "white"
                            : state.isFocused
                            ? "black"
                            : "black",
                          "&:hover": {
                            backgroundColor: "#E1F0E3",
                            color: "black",
                          },
                        }),
                      }}
                    />
                  </div>
                  <div className="col-span-2">
                    <form>
                      <div className="grid lg:grid-cols-12 md:grid-cols-12 sm:grid-cols-12 -mt-5 grid-cols-12 xl:px-10 lg:px-10 xl:gap-5 lg:gap-5 gap-2 flex justify-center">
                        <div
                          className="lg:col-span-5 md:col-span-5 sm:col-span-5 col-span-5 lg:mt-0 md:mt-0 sm:mt-0"
                          style={{ display: "flex", alignItems: "flex-end" }}
                        >
                          <label
                            className="text-green"
                            style={{ marginRight: "5px" }}
                          >
                            From
                          </label>
                          <MuiPickersUtilsProvider utils={DateFnsMomentUtils}>
                            <DatePicker
                              format="MM/dd/yyyy"
                              value={fromDate}
                              onChange={(date) =>
                                handleDateChange1("from", date)
                              }
                              variant="inline"
                              maxDate={currenTDates}
                              autoOk
                              style={{ width: "100%" }}
                              inputProps={{ readOnly: true }}
                              InputProps={{
                                endAdornment: (
                                  <EventIcon
                                    style={{ width: "20", height: "20" }}
                                  />
                                ),
                              }}
                            />
                          </MuiPickersUtilsProvider>
                        </div>
                        <div
                          className="lg:col-span-5 md:col-span-5 sm:col-span-5 col-span-5"
                          style={{ display: "flex", alignItems: "flex-end" }}
                        >
                          <label
                            className="text-green"
                            style={{ marginRight: "5px" }}
                          >
                            To
                          </label>

                          <MuiPickersUtilsProvider utils={DateFnsMomentUtils}>
                            <DatePicker
                              format="MM/dd/yyyy"
                              value={toDate}
                              onChange={(date) => handleDateChange1("to", date)}
                              variant="inline"
                              maxDate={currenTDates}
                              autoOk
                              inputProps={{ readOnly: true }}
                              InputProps={{
                                endAdornment: (
                                  <EventIcon
                                    style={{ width: "20", height: "20" }}
                                  />
                                ),
                              }}
                            />
                          </MuiPickersUtilsProvider>
                        </div>
                        <div
                          className="lg:col-span-1 col-span-1"
                          style={{ marginLeft: "-37px" }}
                        >
                          <button
                            style={{ background: "none" }}
                            className="text-green  text-2xl"
                            onClick={(e) => handleClear(e)}
                          >
                            x
                          </button>
                        </div>
                        <div className="lg:col-span-1 col-span-1">
                          <button
                            className="bg-green py-2 text-white mt-4 flex justify-between items-stretch
   font-popins shadow-md hover:shadow-gray transition duration-500 cursor-pointer hover:bg-green border-none hover:border-none px-4
 "
                            onClick={(e) => handleSearch1(e)}
                            style={{ fontWeight: "bold", borderRadius: "10px" }}
                          >
                            <svg
                              className="h-5 w-5 ms-1 mt-0.5 text-white mr-1"
                              style={{ fontWeight: "bold" }}
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="4"
                              strokeLinejoin="round"
                            >
                              {" "}
                              <circle cx="10" cy="10" r="7"></circle>{" "}
                              <line x1="21" y1="21" x2="15" y2="15"></line>
                            </svg>
                            <span>Search</span>{" "}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                  <div className="flex items-center justify-end lg:col-span-1 col-span-1 ml-4 ">
                    <label className="text-sm  px-7">
                      <input
                        type="radio"
                        className="w-3 h-3 mr-2 form-radio text-green"
                        name="mediaType"
                        value="images"
                        checked={mediaType === "images"}
                        onChange={handleMediaType}
                        style={{ accentColor: "green" }}
                      />
                      Images
                    </label>
                    <label className="text-sm mr-5">
                      <input
                        type="radio"
                        className="w-3 h-3 mr-2 form-radio text-green lg:ms-5"
                        name="mediaType"
                        value="videos"
                        checked={mediaType === "videos"}
                        onChange={handleMediaType}
                        style={{ accentColor: "green" }}
                      />
                      Videos
                    </label>
                  </div>
                  {/* <TextField
        label="Enter progress"
        variant="outlined"
        type="number"
        value={progress}
        onChange={handleInputChange}
        inputProps={{ min: 0, max: 100 }}
        fullWidth
      />   */}
                </div>
                <div
                  className="grid lg:grid-cols-5  sm:grid-cols-5 md:grid-cols-5 grid-cols-1  mt-5 "
                  style={{
                    display: "block",
                    justifyContent: "center",
                  }}
                >
                  <div className="lg:col-span-4  md:col-span-4  sm:col-span-5 col-span-4  ">
                    {loading ? (
                      <Loading />
                    ) : (
                      <div className="grid grid-cols-1  gap-5 ">
                        {mediaType === "images" && (
                          <div className="col-span-1 shadow-lg w-full  ">
                            <div className="bg-green shadow-lg sticky top-0">
                              <h1
                                className="text-center text-xl text-white font-serif pb-2 pt-2"
                                style={{ fontWeight: "900" }}
                              >
                                Images
                              </h1>
                            </div>

                            <TableContainer component={Paper}>
                              <div>
                                <Table
                                  sx={{ minWidth: 650 }}
                                  aria-label="simple table"
                                >
                                  <TableHead className="sticky top-0   font-bold">
                                    <TableRow className=" text-white font-bold   ">
                                      <TableCell
                                        align="center"
                                        className="border-r border-green  font-popins font-bold "
                                        style={{ fontSize: "20px" }}
                                      >
                                        S.No
                                      </TableCell>
                                      <TableCell
                                        align="center"
                                        className="border-r border-green  font-popins font-bold "
                                        style={{ fontSize: "20px" }}
                                      >
                                        Vehicle Reg
                                      </TableCell>
                                      <TableCell
                                        align="center"
                                        className="border-r border-green  font-popins font-bold "
                                        style={{ fontSize: "20px" }}
                                      >
                                        Requested DateTime
                                      </TableCell>
                                      <TableCell
                                        align="center"
                                        className="border-r border-green  font-popins font-bold "
                                        style={{ fontSize: "20px" }}
                                      >
                                        Camera Type
                                      </TableCell>
                                      <TableCell
                                        align="center"
                                        className="border-r border-green text-center font-popins font-bold "
                                        style={{ fontSize: "20px" }}
                                      >
                                        Action
                                      </TableCell>
                                    </TableRow>
                                  </TableHead>
                                  {filteredDataIsAvaialable === false ? (
                                    <TableRow>
                                      <TableCell colSpan={4} align="center">
                                        <p
                                          className="mt-10 font-bold"
                                          style={{ fontSize: "24px" }}
                                        >
                                          No data found
                                        </p>
                                      </TableCell>
                                    </TableRow>
                                  ) : (
                                    <TableBody>
                                      {/*  add an extra data*/}
                                      {/* hereprogresscamera */}
                                      {progress < 100 &&
                                        progress > 0 &&
                                        socketdata.filetype === ".jpeg" && (
                                          <TableRow>
                                            <TableCell
                                              align="center"
                                              className="border-r border-green  font-popins text-black font-normal"
                                              style={{
                                                fontSize: "16px",
                                                padding: "4px 8px",
                                              }}
                                            >
                                              0
                                            </TableCell>
                                            <TableCell
                                              align="center"
                                              className="border-r border-green  font-popins text-black font-normal"
                                              style={{
                                                fontSize: "16px",
                                                padding: "4px 8px",
                                              }}
                                            >
                                              {socketdata.vehicle}
                                            </TableCell>
                                            <TableCell
                                              align="center"
                                              className="border-r border-green  font-popins text-black font-normal"
                                              style={{
                                                fontSize: "16px",
                                                padding: "4px 8px",
                                              }}
                                            >
                                              {backFromUnix(
                                                socketdata.timestamp,
                                                session.timezone
                                              )}
                                            </TableCell>
                                            <TableCell
                                              align="center"
                                              className="border-r border-green  font-popins text-black font-normal"
                                              style={{
                                                fontSize: "16px",
                                                padding: "4px 8px",
                                              }}
                                            >
                                              {(socketdata.camera_type ||
                                                socketdata.camera_type) ===
                                              "%photof"
                                                ? "Front"
                                                : (socketdata.camera_type ||
                                                    socketdata.camera_type) ===
                                                  "%photor"
                                                ? "Back"
                                                : " "}
                                            </TableCell>
                                            <TableCell
                                              colSpan={1}
                                              align="center"
                                            >
                                              <ProgressBar
                                                progress={progress}
                                              />
                                            </TableCell>
                                          </TableRow>
                                        )}
                                      {records.map((item, index) => {
                                        if (item.fileType === 1) {
                                          const currentPage1 = currentPage;
                                          const itemIndex = index % 8;
                                          const currentItemNumber =
                                            (currentPage1 - 1) * 8 +
                                            itemIndex +
                                            1;
                                          const filenametodate = parseInt(
                                            item.fileName.split(".")[0],
                                            10
                                          );

                                          const timingZone = session.timezone;
                                          const timerequested = backFromUnix(
                                            filenametodate,
                                            timingZone
                                          );

                                          return (
                                            <TableRow
                                              key={index}
                                              className="cursor-pointer hover:bg-[#e2f6f0]"
                                            >
                                              <TableCell
                                                align="center"
                                                className="border-r border-green font-popins text-black font-normal"
                                                style={{
                                                  fontSize: "16px",
                                                  padding: "4px 8px",
                                                }}
                                              >
                                                {currentItemNumber}
                                              </TableCell>
                                              <TableCell
                                                align="center"
                                                className="border-r border-green font-popins text-black font-normal"
                                                style={{
                                                  fontSize: "16px",
                                                  padding: "2px 4px",
                                                }}
                                              >
                                                {item.Vehicle}
                                              </TableCell>
                                              <TableCell
                                                align="center"
                                                className="border-r border-green font-popins text-black font-normal"
                                                style={{
                                                  fontSize: "16px",
                                                  padding: "4px 8px",
                                                }}
                                              >
                                                {timerequested}
                                              </TableCell>
                                              <TableCell
                                                align="center"
                                                className="border-r border-green font-popins text-black font-normal"
                                                style={{
                                                  fontSize: "16px",
                                                  padding: "2px 4px",
                                                }}
                                              >
                                                {(item.cameraType ||
                                                  item.cameraType) === "%photof"
                                                  ? "Front"
                                                  : (item.cameraType ||
                                                      item.cameraType) ===
                                                    "%photor"
                                                  ? "Back"
                                                  : " "}
                                              </TableCell>
                                              <TableCell
                                                align="center"
                                                className="border-r border-green font-popins text-black font-normal"
                                                style={{ padding: "4px 8px" }}
                                              >
                                                <div
                                                  style={{ padding: "0 20px" }}
                                                >
                                                  <button
                                                    onClick={() => {
                                                      handleOpen1(item);
                                                    }}
                                                    className="text-white bg-green py-2 px-2"
                                                  >
                                                    <svg
                                                      viewBox="0 0 24 24"
                                                      fill="none"
                                                      xmlns="http://www.w3.org/2000/svg"
                                                      className="w-6 h-6"
                                                    >
                                                      <circle
                                                        cx="12"
                                                        cy="12"
                                                        r="3.5"
                                                        stroke="#FFFFFF"
                                                      ></circle>
                                                      <path
                                                        d="M20.188 10.9343C20.5762 11.4056 20.7703 11.6412 20.7703 12C20.7703 12.3588 20.5762 12.5944 20.188 13.0657C18.7679 14.7899 15.6357 18 12 18C8.36427 18 5.23206 14.7899 3.81197 13.0657C3.42381 12.5944 3.22973 12.3588 3.22973 12C3.22973 11.6412 3.42381 11.4056 3.81197 10.9343C5.23206 9.21014 8.36427 6 12 6C15.6357 6 18.7679 9.21014 20.188 10.9343Z"
                                                        stroke="#FFFFFF"
                                                      ></path>
                                                    </svg>
                                                  </button>{" "}
                                                  <button
                                                    onClick={() => {
                                                      handleDownload(item);
                                                    }}
                                                    className="text-white bg-green py-2 px-2"
                                                  >
                                                    <svg
                                                      viewBox="0 0 24 24"
                                                      fill="none"
                                                      xmlns="http://www.w3.org/2000/svg"
                                                      className="w-6 h-6"
                                                    >
                                                      <path
                                                        d="M12.5535 16.5061C12.4114 16.6615 12.2106 16.75 12 16.75C11.7894 16.75 11.5886 16.6615 11.4465 16.5061L7.44648 12.1311C7.16698 11.8254 7.18822 11.351 7.49392 11.0715C7.79963 10.792 8.27402 10.8132 8.55352 11.1189L11.25 14.0682V3C11.25 2.58579 11.5858 2.25 12 2.25C12.4142 2.25 12.75 2.58579 12.75 3V14.0682L15.4465 11.1189C15.726 10.8132 16.2004 10.792 16.5061 11.0715C16.8118 11.351 16.833 11.8254 16.5535 12.1311L12.5535 16.5061Z"
                                                        fill="#FFFFFF"
                                                      ></path>
                                                      <path
                                                        d="M3.75 15C3.75 14.5858 3.41422 14.25 3 14.25C2.58579 14.25 2.25 14.5858 2.25 15V15.0549C2.24998 16.4225 2.24996 17.5248 2.36652 18.3918C2.48754 19.2919 2.74643 20.0497 3.34835 20.6516C3.95027 21.2536 4.70814 21.5125 5.60825 21.6335C6.47522 21.75 7.57754 21.75 8.94513 21.75H15.0549C16.4225 21.75 17.5248 21.75 18.3918 21.6335C19.2919 21.5125 20.0497 21.2536 20.6517 20.6516C21.2536 20.0497 21.5125 19.2919 21.6335 18.3918C21.75 17.5248 21.75 16.4225 21.75 15.0549V15C21.75 14.5858 21.4142 14.25 21 14.25C20.5858 14.25 20.25 14.5858 20.25 15C20.25 16.4354 20.2484 17.4365 20.1469 18.1919C20.0482 18.9257 19.8678 19.3142 19.591 19.591C19.3142 19.8678 18.9257 20.0482 18.1919 20.1469C17.4365 20.2484 16.4354 20.25 15 20.25H9C7.56459 20.25 6.56347 20.2484 5.80812 20.1469C5.07435 20.0482 4.68577 19.8678 4.40901 19.591C4.13225 19.3142 3.9518 18.9257 3.85315 18.1919C3.75159 17.4365 3.75 16.4354 3.75 15Z"
                                                        fill="#FFFFFF"
                                                      ></path>
                                                    </svg>
                                                  </button>
                                                </div>
                                                <Modal
                                                  open={open1}
                                                  onClose={handleClose}
                                                  BackdropComponent={Backdrop}
                                                  BackdropProps={{
                                                    timeout: 500,
                                                    style: {
                                                      backgroundColor:
                                                        "transparent",
                                                      filter: "blur(19px)",
                                                    },
                                                  }}
                                                >
                                                  <Fade in={open1}>
                                                    <Box sx={modalStyles}>
                                                      <a
                                                        onClick={handleClose}
                                                        style={{
                                                          position: "absolute",
                                                          top: -10,
                                                          right: -10,
                                                          fontWeight: "bold",
                                                          fontSize: "16px",
                                                          width: "30px",
                                                          height: "30px",
                                                          backgroundColor:
                                                            "red",
                                                          color: "white",
                                                          cursor: "pointer",
                                                          padding: "2px",
                                                          borderRadius: "50%",
                                                          textAlign: "center",
                                                        }}
                                                      >
                                                        X
                                                      </a>
                                                      <div
                                                        onClick={
                                                          handleFullScreen
                                                        }
                                                        style={{
                                                          position: "absolute",
                                                          bottom: 10,
                                                          right: 30,
                                                          color: "green",
                                                          width: "30px",
                                                          height: "30px",
                                                          borderRadius: "50%",
                                                          display: "flex",
                                                          alignItems: "center",
                                                          justifyContent:
                                                            "center",
                                                          cursor: "pointer",
                                                          backgroundColor:
                                                            "white",
                                                          transition:
                                                            "color 0.3s, background-color 0.3s",
                                                        }}
                                                        className="fullscreen-button"
                                                      >
                                                        <FullscreenIcon />
                                                      </div>
                                                      <style jsx>{`
                                                        .fullscreen-button:hover {
                                                          color: white !important;
                                                          background-color: black !important;
                                                        }
                                                      `}</style>
                                                      <img
                                                        src={singleImage}
                                                        alt="Modal Content"
                                                        style={{
                                                          height: isFullScreen
                                                            ? "90%"
                                                            : "490px",
                                                          width: isFullScreen
                                                            ? "100%"
                                                            : "1100px",
                                                          radius: "2px",
                                                        }}
                                                      />
                                                    </Box>
                                                  </Fade>
                                                </Modal>
                                                {isFullScreen && (
                                                  <div
                                                    style={{
                                                      position: "fixed",
                                                      top: 0,
                                                      left: 0,
                                                      width: "100%",
                                                      height: "100%",
                                                      zIndex: 9999,
                                                      backgroundColor: "black",
                                                      display: "flex",
                                                      justifyContent: "center",
                                                      alignItems: "center",
                                                    }}
                                                    onClick={
                                                      handleExitFullScreen
                                                    }
                                                  >
                                                    <img
                                                      src={singleImage}
                                                      alt="Modal Content"
                                                      style={{
                                                        height: "100%",
                                                        width: "auto",
                                                      }}
                                                    />
                                                    <IconButton
                                                      style={{
                                                        position: "absolute",
                                                        bottom: 20,
                                                        right: 20,
                                                        color: "white",
                                                      }}
                                                      sx={{
                                                        "&:hover": {
                                                          color: "red",
                                                        },
                                                      }}
                                                      onClick={
                                                        handleExitFullScreen
                                                      }
                                                    >
                                                      <FullscreenExitIcon />
                                                    </IconButton>
                                                  </div>
                                                )}
                                              </TableCell>
                                            </TableRow>
                                          );
                                        } else {
                                          return null; // Render nothing or handle other cases
                                        }
                                      })}
                                    </TableBody>
                                  )}
                                </Table>
                              </div>
                            </TableContainer>

                            <div
                              className="flex  justify-end mt-8"
                              // style={{ position: "fixed", bottom: "1%" }}
                            >
                              <div className="grid lg:grid-cols-4 my-4 ">
                                <div className="col-span-1">
                                  <p className="mt-1 text-labelColor text-end text-sm">
                                    Total{" "}
                                    {
                                      filteredRecords.filter(
                                        (record) => record.fileType === 1
                                      ).length
                                    }{" "}
                                    items
                                  </p>
                                </div>
                                <div className="col-span-2 ">
                                  <Stack spacing={2}>
                                    <Pagination
                                      count={totalCount}
                                      // page={currentPage}
                                      onChange={handleChange}
                                      className="text-sm"
                                    />
                                  </Stack>
                                </div>
                                <div className="col-lg-1 mt-1">
                                  <span className="text-sm">Go To</span>
                                  <input
                                    type="text"
                                    className="w-14 border border-grayLight outline-green mx-2 px-2"
                                    onChange={(e: any) =>
                                      setInput(e.target.value)
                                    }
                                  />
                                  <span
                                    className="text-labelColor text-sm cursor-pointer"
                                    onClick={handleClickPagination}
                                  >
                                    page &nbsp;&nbsp;
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <Dialog
                          open={open}
                          handler={handleOpen}
                          className="w-3/6 ms-auto mr-auto bg-bgLight"
                          placeholder=""
                        >
                          <Image
                            src={singleImage}
                            width="1000"
                            height="100"
                            style={{
                              height: "100vh",
                              transform: "rotate(180deg)",
                            }}
                            alt="Image"
                          />
                        </Dialog>
                        {mediaType === "videos" && (
                          <div className="col-span-1 shadow-lg w-full">
                            <div className="bg-green shadow-lg sticky top-0">
                              <h1
                                className="text-center text-xl text-white font-serif pb-2 pt-2"
                                style={{ fontWeight: "900" }}
                              >
                                Videos
                              </h1>
                            </div>

                            {/* videowork */}
                            <TableContainer component={Paper}>
                              <div>
                                <Table
                                  sx={{ minWidth: 650 }}
                                  aria-label="simple table"
                                >
                                  <TableHead className="sticky top-0   font-bold">
                                    <TableRow className=" text-white font-bold   ">
                                      <TableCell
                                        align="center"
                                        className="border-r border-green  font-popins font-bold "
                                        style={{ fontSize: "20px" }}
                                      >
                                        S.No
                                      </TableCell>
                                      <TableCell
                                        align="center"
                                        className="border-r border-green  font-popins font-bold "
                                        style={{ fontSize: "20px" }}
                                      >
                                        Vehicle Reg
                                      </TableCell>
                                      <TableCell
                                        align="center"
                                        className="border-r border-green  font-popins font-bold "
                                        style={{ fontSize: "20px" }}
                                      >
                                        Requested DateTime
                                      </TableCell>
                                      <TableCell
                                        align="center"
                                        className="border-r border-green  font-popins font-bold "
                                        style={{ fontSize: "20px" }}
                                      >
                                        Camera Type
                                      </TableCell>
                                      <TableCell
                                        align="left"
                                        className="border-r border-green text-center font-popins font-bold "
                                        style={{ fontSize: "20px" }}
                                      >
                                        Action
                                      </TableCell>
                                    </TableRow>
                                  </TableHead>
                                  {filteredDataIsAvaialable === false ? (
                                    <TableRow>
                                      <TableCell colSpan={4} align="center">
                                        <p
                                          className="mt-10 font-bold"
                                          style={{ fontSize: "24px" }}
                                        >
                                          No data found
                                        </p>
                                      </TableCell>
                                    </TableRow>
                                  ) : (
                                    <TableBody>
                                      {/* hereprogress */}
                                      {progress < 100 &&
                                        progress > 0 &&
                                        socketdata.filetype === ".h265" && (
                                          <TableRow>
                                            <TableCell
                                              align="center"
                                              className="border-r border-green  font-popins text-black font-normal"
                                              style={{
                                                fontSize: "16px",
                                                padding: "4px 8px",
                                              }}
                                            >
                                              0
                                            </TableCell>
                                            <TableCell
                                              align="center"
                                              className="border-r border-green  font-popins text-black font-normal"
                                              style={{
                                                fontSize: "16px",
                                                padding: "4px 8px",
                                              }}
                                            >
                                              {socketdata.vehicle}
                                            </TableCell>
                                            <TableCell
                                              align="center"
                                              className="border-r border-green  font-popins text-black font-normal"
                                              style={{
                                                fontSize: "16px",
                                                padding: "4px 8px",
                                              }}
                                            >
                                              {backFromUnix(
                                                socketdata.timestamp,
                                                session.timezone
                                              )}
                                            </TableCell>
                                            <TableCell
                                              align="center"
                                              className="border-r border-green  font-popins text-black font-normal"
                                              style={{
                                                fontSize: "16px",
                                                padding: "4px 8px",
                                              }}
                                            >
                                              {(socketdata.camera_type ||
                                                socketdata.camera_type) ===
                                              "%videof"
                                                ? "Front"
                                                : (socketdata.camera_type ||
                                                    socketdata.camera_type) ===
                                                  "%videor"
                                                ? "Back"
                                                : " "}
                                            </TableCell>
                                            <TableCell
                                              colSpan={1}
                                              align="center"
                                            >
                                              <ProgressBar
                                                progress={progress}
                                              />
                                            </TableCell>
                                          </TableRow>
                                        )}
                                      {recordsVideo.map(
                                        (
                                          item: pictureVideoDataOfVehicleT,
                                          index
                                        ) => {
                                          if (item.fileType === 2) {
                                            const filenametodate = parseInt(
                                              item.fileName.split(".")[0],
                                              10
                                            );
                                            const timingZone = session.timezone;
                                            const timerequested = backFromUnix(
                                              filenametodate,
                                              timingZone
                                            );
                                            const currentPage =
                                              currentPageVideo;
                                            const itemIndex = index % 8;
                                            const currentItemNumber =
                                              (currentPage - 1) * 8 +
                                              itemIndex +
                                              1;
                                            return (
                                              <TableRow
                                                key={index}
                                                className="cursor-pointer hover:bg-[#e2f6f0]"
                                              >
                                                <TableCell
                                                  align="center"
                                                  className="border-r border-green  font-popins text-black font-normal"
                                                  style={{
                                                    fontSize: "16px",
                                                    padding: "4px 8px",
                                                  }}
                                                >
                                                  {currentItemNumber}
                                                </TableCell>
                                                <TableCell
                                                  align="center"
                                                  className="border-r border-green  font-popins text-black font-normal"
                                                  style={{
                                                    fontSize: "16px",
                                                    padding: "4px 8px",
                                                  }}
                                                >
                                                  {item.Vehicle}
                                                </TableCell>
                                                <TableCell
                                                  align="center"
                                                  className="border-r border-green  font-popins text-black font-normal"
                                                  style={{
                                                    fontSize: "16px",
                                                    padding: "4px 8px",
                                                  }}
                                                >
                                                  {/* const timingZone = session.timezone;
      const timerequested = backFromUnix(filenametodate, timingZone); */}
                                                  {timerequested}
                                                  {/* {new Date(item?.dateTime).toLocaleString(
                                      "en-US",
                                      {
                                        timeZone: session?.timezone,
                                        year: "numeric", 
                 month: "long",                
                 day: "2-digit", 
                 hour: "numeric", 
                 minute: "numeric", 
                 second: "numeric", 
                 hour12: true,
                                      }
                                    )} */}
                                                </TableCell>
                                                <TableCell
                                                  align="center"
                                                  className="border-r border-green  font-popins text-black font-normal"
                                                  style={{
                                                    fontSize: "16px",
                                                    padding: "4px 8px",
                                                  }}
                                                >
                                                  {(item?.cameraType ||
                                                    item.cameraType) ===
                                                  "%videof"
                                                    ? "Front"
                                                    : (item?.cameraType ||
                                                        item.cameraType) ===
                                                      "%videor"
                                                    ? "Back"
                                                    : " "}
                                                </TableCell>
                                                <TableCell
                                                  align="center" // Set align to center
                                                  className="border-r border-green font-popins text-black font-normal"
                                                  style={{ padding: "4px 8px" }}
                                                >
                                                  <div
                                                    style={{
                                                      padding: "0 20px",
                                                    }}
                                                  >
                                                    {/* {item.status === "pending" ?

 <Box mt={2}  >
   <ProgressBar progress={progress} />
 </Box>: */}

                                                    <span>
                                                      <button
                                                        onClick={() =>
                                                          handleOpenSecond1(
                                                            item
                                                          )
                                                        }
                                                        className="text-white bg-green py-2 px-2 "
                                                      >
                                                        <svg
                                                          viewBox="0 0 24 24"
                                                          fill="none"
                                                          xmlns="http://www.w3.org/2000/svg"
                                                          className="w-6 h-6  "
                                                        >
                                                          <g
                                                            id="SVGRepo_bgCarrier"
                                                            strokeWidth="0"
                                                          ></g>
                                                          <g
                                                            id="SVGRepo_tracerCarrier"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                          ></g>
                                                          <g id="SVGRepo_iconCarrier">
                                                            <circle
                                                              cx="12"
                                                              cy="12"
                                                              r="3.5"
                                                              stroke="#FFFFFF"
                                                            ></circle>
                                                            <path
                                                              d="M20.188 10.9343C20.5762 11.4056 20.7703 11.6412 20.7703 12C20.7703 12.3588 20.5762 12.5944 20.188 13.0657C18.7679 14.7899 15.6357 18 12 18C8.36427 18 5.23206 14.7899 3.81197 13.0657C3.42381 12.5944 3.22973 12.3588 3.22973 12C3.22973 11.6412 3.42381 11.4056 3.81197 10.9343C5.23206 9.21014 8.36427 6 12 6C15.6357 6 18.7679 9.21014 20.188 10.9343Z"
                                                              stroke="#FFFFFF"
                                                            ></path>
                                                          </g>
                                                        </svg>
                                                      </button>{" "}
                                                      <Modal
                                                        open={openvideo}
                                                        onClose={
                                                          handleClosevideo
                                                        }
                                                        BackdropComponent={
                                                          Backdrop
                                                        }
                                                        BackdropProps={{
                                                          timeout: 500,
                                                          style: {
                                                            backgroundColor:
                                                              "transparent",
                                                          },
                                                        }}
                                                      >
                                                        <Fade in={openvideo}>
                                                          <Box sx={modalStyles}>
                                                            <a
                                                              onClick={
                                                                handleClosevideo
                                                              }
                                                              style={{
                                                                position:
                                                                  "absolute",
                                                                top: -10,
                                                                right: -10,
                                                                fontWeight:
                                                                  "bold",
                                                                fontSize:
                                                                  "16px",
                                                                width: "30px",
                                                                height: "30px",
                                                                backgroundColor:
                                                                  "red",
                                                                color: "white",
                                                                cursor:
                                                                  "pointer",
                                                                padding: "2px",
                                                                borderRadius:
                                                                  "50%",
                                                                textAlign:
                                                                  "center",
                                                                zIndex: "2000",
                                                              }}
                                                            >
                                                              X
                                                            </a>

                                                            <div
                                                              className={`video-container ${
                                                                isFullScreen
                                                                  ? "fullscreen"
                                                                  : ""
                                                              }`}
                                                            >
                                                              <video
                                                                controls
                                                                autoPlay
                                                                style={{
                                                                  height:
                                                                    isFullScreen
                                                                      ? "100%"
                                                                      : "400px",
                                                                  width:
                                                                    isFullScreen
                                                                      ? "100%"
                                                                      : "100%",
                                                                }}
                                                                className="video-element"
                                                                controlsList="noplaybackrate nodownload "
                                                                // disablePictureInPicture
                                                              >
                                                                <source
                                                                  src={
                                                                    singleVideo
                                                                  }
                                                                  type="video/mp4"
                                                                />
                                                              </video>
                                                            </div>
                                                          </Box>
                                                        </Fade>
                                                      </Modal>
                                                      <button
                                                        onClick={() =>
                                                          handleDownload(item)
                                                        }
                                                        className="text-white bg-green py-2 px-2 "
                                                      >
                                                        <svg
                                                          viewBox="0 0 24 24"
                                                          fill="none"
                                                          xmlns="http://www.w3.org/2000/svg"
                                                          className="w-6 h-6 "
                                                        >
                                                          <g
                                                            id="SVGRepo_bgCarrier"
                                                            strokeWidth="0"
                                                          ></g>
                                                          <g
                                                            id="SVGRepo_tracerCarrier"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                          ></g>
                                                          <g id="SVGRepo_iconCarrier">
                                                            <path
                                                              d="M12.5535 16.5061C12.4114 16.6615 12.2106 16.75 12 16.75C11.7894 16.75 11.5886 16.6615 11.4465 16.5061L7.44648 12.1311C7.16698 11.8254 7.18822 11.351 7.49392 11.0715C7.79963 10.792 8.27402 10.8132 8.55352 11.1189L11.25 14.0682V3C11.25 2.58579 11.5858 2.25 12 2.25C12.4142 2.25 12.75 2.58579 12.75 3V14.0682L15.4465 11.1189C15.726 10.8132 16.2004 10.792 16.5061 11.0715C16.8118 11.351 16.833 11.8254 16.5535 12.1311L12.5535 16.5061Z"
                                                              fill="#FFFFFF"
                                                            ></path>
                                                            <path
                                                              d="M3.75 15C3.75 14.5858 3.41422 14.25 3 14.25C2.58579 14.25 2.25 14.5858 2.25 15V15.0549C2.24998 16.4225 2.24996 17.5248 2.36652 18.3918C2.48754 19.2919 2.74643 20.0497 3.34835 20.6516C3.95027 21.2536 4.70814 21.5125 5.60825 21.6335C6.47522 21.75 7.57754 21.75 8.94513 21.75H15.0549C16.4225 21.75 17.5248 21.75 18.3918 21.6335C19.2919 21.5125 20.0497 21.2536 20.6517 20.6516C21.2536 20.0497 21.5125 19.2919 21.6335 18.3918C21.75 17.5248 21.75 16.4225 21.75 15.0549V15C21.75 14.5858 21.4142 14.25 21 14.25C20.5858 14.25 20.25 14.5858 20.25 15C20.25 16.4354 20.2484 17.4365 20.1469 18.1919C20.0482 18.9257 19.8678 19.3142 19.591 19.591C19.3142 19.8678 18.9257 20.0482 18.1919 20.1469C17.4365 20.2484 16.4354 20.25 15 20.25H9C7.56459 20.25 6.56347 20.2484 5.80812 20.1469C5.07435 20.0482 4.68577 19.8678 4.40901 19.591C4.13225 19.3142 3.9518 18.9257 3.85315 18.1919C3.75159 17.4365 3.75 16.4354 3.75 15Z"
                                                              fill="#FFFFFF"
                                                            ></path>
                                                          </g>
                                                        </svg>
                                                      </button>
                                                    </span>
                                                    {/* }   */}
                                                  </div>
                                                </TableCell>
                                              </TableRow>
                                            );
                                          }
                                        }
                                      )}
                                    </TableBody>
                                  )}
                                </Table>
                              </div>
                            </TableContainer>
                            <div className="flex  justify-end mt-8 ">
                              <div className="grid lg:grid-cols-4 my-4">
                                <div className="col-span-1">
                                  <p className="mt-1 text-labelColor text-end text-sm">
                                    Total{" "}
                                    {
                                      filteredRecords.filter(
                                        (record) => record.fileType === 2
                                      ).length
                                    }{" "}
                                    items
                                  </p>
                                </div>

                                <div className="col-span-2">
                                  <Stack spacing={2}>
                                    <Pagination
                                      count={totalCountVideo}
                                      // page={currentPage}
                                      onChange={handleChangeVideo}
                                      className="text-sm"
                                    />
                                  </Stack>
                                </div>
                                <div className="col-lg-1 mt-1">
                                  <span className="text-sm">Go To</span>
                                  <input
                                    type="text"
                                    value={inputValue}
                                    className="w-14 border border-grayLight outline-green mx-2 px-2"
                                    onChange={(
                                      e: React.ChangeEvent<HTMLInputElement>
                                    ) => setInputValue(e.target.value)}
                                  />
                                  <span
                                    className="text-labelColor text-sm cursor-pointer"
                                    onClick={handleClickGo}
                                  >
                                    page &nbsp;&nbsp;
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Collapse>
      </List>
      <br></br>
      <br></br>
      <Toaster position="top-center" reverseOrder={false} />
    </div>
  );
}
