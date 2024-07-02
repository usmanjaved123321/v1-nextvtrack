"use client";
import React, { ChangeEvent, useRef } from "react";
import { useSession } from "next-auth/react";

import { useState, useEffect } from "react";
import {
  portalGprsCommand,
  // responsegprs
  // ,
  vehicleListByClientId,
  videoList,
  vehiclebyClientid,
  getDualCamVehicleByclientId,
  getVehicleDataByClientId,
  // getGprsCommandLatest,
} from "@/utils/API_CALLS";
import { pictureVideoDataOfVehicleT } from "@/types/videoType";
import Select from "react-select";
import moment, { duration } from "moment";
import { DeviceAttach } from "@/types/vehiclelistreports";
import { Toaster, toast } from "react-hot-toast";
import "./newstyle.css";
import { dateTimeToTimestamp } from "@/utils/unixTimestamp";
// import { List, ListItem, ListItemText, Collapse, RadioGroup, Radio } from '@material-ui/core';
import { socket } from "@/utils/socket";
import uniqueDataByIMEIAndLatestTimestamp from "@/utils/uniqueDataByIMEIAndLatestTimestamp";
import { useRouter } from "next/navigation";
import DateFnsMomentUtils from "@date-io/date-fns";
import EventIcon from "@material-ui/icons/Event";
import { MaterialUiPickersDate } from "@material-ui/pickers/typings/date";
import { Box } from "@mui/material";
import { MuiPickersUtilsProvider, DatePicker } from "@material-ui/pickers";
import { isPagesAPIRouteMatch } from "next/dist/server/future/route-matches/pages-api-route-match";
import { io } from "socket.io-client";
import { VehicleData } from "@/types/vehicle";

export default function Request({ socketdata, deviceCommandText }) {
  const [pictureVideoDataOfVehicle, setPictureVideoDataOfVehicle] = useState<
    pictureVideoDataOfVehicleT[]
  >([]);
  const { data: session } = useSession();
  const [loading, setLaoding] = useState(false);
  const [currentPageVideo, setCurrentPageVideo] = useState(1);
  const [disabledButton, setdisabledButton] = useState(true);
  const [CustomDateField, setCustomDateField] = useState(false);
  const [openFrontAndBackCamera, setOpenFrontAndBackCamera] = useState(false);
  const [selectedCameraType, setSelectedCameraType] = useState(null);
  const [selectedFileType, setSelectedFileType] = useState(null);
  const [selectedDateFilter, setSelectedDateFilter] = useState(null);
  const [customDate, setCustomDate] = useState(false);
  const [showDurationTab, setshowDurationTab] = useState(false);
  const [latestGprs, setLatestGprs] = useState(false);
  const [deviceResponse, setDeviceResponse] = useState<any>("");
  const [toastId, setToastId] = useState<any>(null);
  const [vehicleList, setVehicleList] = useState<DeviceAttach[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<DeviceAttach | null>(
    null
  );
  const sortedRecords = pictureVideoDataOfVehicle.sort(
    (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
  );
  const [filteredRecords, setFilteredRecords] = useState(sortedRecords);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedduration, setSelectedDuration] = useState("");
  const [disabledRequestButton, setdisabledRequestButton] = useState(true);
  const router = useRouter();
  const carData = useRef<VehicleData[]>([]);

  const handlevideodate = (date: MaterialUiPickersDate | null) => {
    if (date !== null) {
      const dateValue = moment(date).format("YYYY-MM-DD");
      setSelectedDate(dateValue);
    }
  };

  const currenTDates = new Date();

  useEffect(() => {
    const vehicleListData = async () => {
      try {
        if (session?.userRole == "Admin" || session?.userRole == "Controller") {
          const Data = await vehiclebyClientid({
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

  useEffect(() => {
    const vehicleListData = async () => {
      try {
        setLaoding(true);
        if (session) {
          const response = await videoList({
            token: session?.accessToken,
            clientId: session?.clientId,
          });
          setPictureVideoDataOfVehicle(response);
          setFilteredRecords(response);
        }
        setLaoding(false);
      } catch (error) {
        selectedVehicle;
        console.error("Error fetching zone data:", error);
      }
    };
    vehicleListData();
  }, [session]);

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

      toast.success(data?.commandtext, {
        position: "top-center",
      });
    });

    // Clean up on unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  /* useEffect(() => {
  // Check if selectedVehicle is not null
  if (selectedVehicle) {
    // Retrieve carData from localStorage and parse it into an array
  //  const storedData = localStorage.getItem('carData');

    if (carData.current) {
     
      // Find the selected vehicle in carData
      const foundVehicle = carData.current.find((vehicle: { vehicleReg: string; }) => vehicle.vehicleReg === selectedVehicle.vehicleReg);
      
      // If the vehicle is found and its status is "Parked", enable the button
      if (foundVehicle && foundVehicle.vehicleStatus === "Parked") {
       
        setdisabledButton(false);
      } else {
 
        setdisabledButton(true);
      }
    } else {
      // Handle the case where carData is not found in localStorage
    }
  }
}, [selectedVehicle]); */
  useEffect(() => {
    (async function () {
      if (session?.clientId) {
        const clientVehicleData = await getVehicleDataByClientId(
          session?.clientId
        );

        if (clientVehicleData?.data?.Value) {
          let parsedData = JSON.parse(
            clientVehicleData?.data?.Value
          )?.cacheList;
          // call a filter function here to filter by IMEI and latest time stamp
          let uniqueData = uniqueDataByIMEIAndLatestTimestamp(parsedData);
          carData.current = uniqueData;
          if (carData.current) {
            const foundVehicle = carData.current.find(
              (vehicle: { vehicleReg: string }) =>
                vehicle.vehicleReg === selectedVehicle?.vehicleReg
            );
            console.log("Dvfdbvf", foundVehicle);
            if (
              (foundVehicle?.frontCamera?.value == 3 &&
                foundVehicle?.backCamera?.value == 3) ||
              foundVehicle?.frontCamera?.value == 3 ||
              foundVehicle?.backCamera?.value == 3
            ) {
              console.log("if");
              setdisabledButton(true);
              setdisabledRequestButton(false);
            } else if (
              foundVehicle?.frontCamera?.value == 0 &&
              foundVehicle?.backCamera?.value == 0
            ) {
              console.log("else if");
              setdisabledButton(false);
              setdisabledRequestButton(true);
            } else {
              console.log("else ");
              setdisabledButton(true);
              setdisabledRequestButton(true);
            }
            //   setdisabledButton()
          }
          console.log("cardata", carData.current);
        }
      }
    })();
  }, [session, selectedVehicle]);

  useEffect(() => {
    if (session?.clientId) {
      try {
        socket.io.opts.query = { clientId: session?.clientId };
        socket.connect();
        socket.on(
          "message",
          async (data: { cacheList: VehicleData[] } | null | undefined) => {
            if (data === null || data === undefined) {
              return;
            }

            const uniqueData = uniqueDataByIMEIAndLatestTimestamp(
              data?.cacheList
            );

            carData.current = uniqueData;
            // console.log("cardata 2", carData.current)
            //  console.log("carData.current", carData.current)
            /*          const existingData = localStorage.getItem('carData');
          if (existingData) {
            localStorage.removeItem('carData');
          }
          localStorage.setItem('carData', JSON.stringify(uniqueData)); */
          }
        );
      } catch (err) {
        console.log("Socket Error", err);
      }
    }

    return () => {
      socket.disconnect();
    };
  }, [selectedVehicle, session?.clientId]);

  const handleSelectChange = (e: any) => {
    const selectedVehicleId = e;
    const selectedVehicle = vehicleList.find(
      (vehicle) => vehicle.vehicleReg === selectedVehicleId?.value
    );
    setSelectedVehicle(selectedVehicle || null);
  };

  const options =
    vehicleList?.map((item: any) => ({
      value: item.vehicleReg,
      label: item.vehicleReg,
    })) || [];

  const handleCameraTypeChange = (event: { target: { value: any } }) => {
    setSelectedCameraType(event.target.value);
  };
  const handleFileTypeChange = (event: { target: { value: any } }) => {
    let filetype = event.target.value;
    setSelectedFileType(filetype);
    if (filetype === "Video") {
      setshowDurationTab(true);
    } else {
      setshowDurationTab(false);
    }
  };

  const handlecameraOn = async () => {
    toast("Data sent successfully");
    let duration = 500;
    let formvalues = {
      commandtext: `setdigout 1 ${duration}`,
      vehicleReg: selectedVehicle?.vehicleReg,
      command: "",
      createdDate: "",
      modifyDate: "",
      parameter: "",
      deviceIMEI: "",
      status: "Pending",
    };
    if (selectedVehicle == null) {
      return toast.error("Please select vehicle");
    }
    if (session) {
      const response = await toast.promise(
        portalGprsCommand({
          token: session?.accessToken,
          payload: formvalues,
        }),
        {
          loading: "Saving data...",
          success: "Data saved successfully!",
          error: "Error saving data. Please try again.",
        },
        {
          style: {
            border: "1px solid #00B56C",
            padding: "16px",
            color: "#1A202C",
          },
          success: {
            duration: 2000,
            iconTheme: {
              primary: "#00B56C",
              secondary: "#FFFAEE",
            },
          },
          error: {
            duration: 2000,
            iconTheme: {
              primary: "#00B56C",
              secondary: "#FFFAEE",
            },
          },
        }
      );
    }
  };

  const handleSubmit = async () => {
    setLatestGprs(true);
    const selectedValues = {
      vehicle: selectedVehicle,
      cameraType: selectedCameraType,
      fileType: selectedFileType,
      dateFilter: selectedDateFilter,
    };

    const dateTime = {
      date: selectedDate || new Date(),
      time: selectedTime,
    };
    const timestamp = dateTimeToTimestamp(selectedDate, selectedTime);
    let Duration;
    if (Number(selectedduration) <= 10) {
      Duration = Number(selectedduration) + 1;
    } else {
      return toast.error("Please enter duration between 1-10 seconds");
    }
    let commandText;
    if (selectedFileType === "Photo") {
      if (selectedCameraType === "Front") {
        commandText = "camreq: 1,1";
      } else if (selectedCameraType === "Back") {
        commandText = "camreq: 1,2";
      }
    } else if (selectedFileType === "Video") {
      if (selectedCameraType === "Front") {
        commandText = `camreq: 0,1,${timestamp},${Duration}`;
      } else if (selectedCameraType === "Back") {
        commandText = `camreq: 0,2,${timestamp},${Duration}`;
      }
    }
    let formvalues = {
      command: "",
      commandtext: commandText,
      createdDate: "",
      modifyDate: "",
      parameter: "",
      deviceIMEI: "",
      status: "Pending",
      vehicleReg: selectedVehicle?.vehicleReg,
    };

    if (session) {
      const response = await toast.promise(
        portalGprsCommand({
          token: session?.accessToken,
          payload: formvalues,
        }),
        {
          loading: "Saving data...",
          success: "Data saved successfully!",
          error: "Error saving data. Please try again.",
        },
        {
          style: {
            border: "1px solid #00B56C",
            padding: "16px",
            color: "#1A202C",
          },
          success: {
            duration: 2000,
            iconTheme: {
              primary: "#00B56C",
              secondary: "#FFFAEE",
            },
          },
          error: {
            duration: 2000,
            iconTheme: {
              primary: "#00B56C",
              secondary: "#FFFAEE",
            },
          },
        }
      );

      if (socketdata.filetype !== ".h265" || socketdata.filetype !== ".jpeg") {
        if (!toastId) {
          const id = toast.loading("Waiting for Device Response", {
            position: "top-center",
          });
          setToastId(id);
        }
      }

      if (response.success) {
        setSelectedVehicle(null);
        setSelectedFileType(null);
        setSelectedCameraType(null);
        setSelectedDuration("");
        setSelectedTime("");
        setSelectedDate(null);
      }
    }
  };

  if (socketdata.filetype == ".h265" || socketdata.filetype == ".jpeg") {
    toast.dismiss(toastId);
  }

  return (
    <div>
      <div className="tab-pane" id="">
        <div className="grid lg:grid-cols-5  md:grid-cols-3 sm:grid-col-1   px-4 text-start gap-5 bg-bgLight pt-3 gap-16">
          <div className="css-b62m3t-container ">
            <Select
              onChange={handleSelectChange}
              options={options}
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
          <div className="col-span-1">
            <div className="border border-gray ">
              <p className="text-sm text-green -mt-3  bg-bgLight lg:w-32 ms-14 px-4 ">
                Camera Type
              </p>
              <div className="flex items-center">
                <label className="text-sm  px-7">
                  <input
                    type="radio"
                    style={{ accentColor: "green" }}
                    className="w-3 h-3 mr-2 form-radio text-green"
                    name="cameraType"
                    value="Front"
                    checked={selectedCameraType === "Front"}
                    onChange={handleCameraTypeChange}
                  />
                  Front
                </label>
                <label className="text-sm mr-5">
                  <input
                    type="radio"
                    style={{ accentColor: "green" }}
                    className="w-3 h-3 mr-2 form-radio text-green lg:ms-5"
                    name="cameraType"
                    value="Back"
                    checked={selectedCameraType === "Back"}
                    onChange={handleCameraTypeChange}
                  />
                  Back
                </label>
              </div>
            </div>
          </div>
          <div className="col-span-1">
            <div className="border border-gray">
              <p className="text-sm text-green  -mt-3  bg-bgLight lg:w-24 ms-16 px-4">
                File Type
              </p>
              <div className="flex items-center">
                <label className="text-sm px-5">
                  <input
                    type="radio"
                    style={{ accentColor: "green" }}
                    className="w-3 h-3 mr-2 form-radio text-green"
                    name="fileType"
                    value="Photo"
                    checked={selectedFileType === "Photo"}
                    onChange={handleFileTypeChange}
                  />
                  Image
                </label>
                <label className="text-sm mr-5">
                  <input
                    type="radio"
                    style={{ accentColor: "green" }}
                    className="w-3 h-3 mr-2 form-radio text-green lg:ms-5"
                    name="fileType"
                    value="Video"
                    checked={selectedFileType === "Video"}
                    onChange={handleFileTypeChange}
                  />
                  &nbsp;Video
                </label>
              </div>
            </div>
          </div>
          {/* here add suraksha */}
          <div className="col-span-2">
            <button
              className={`bg-green px-5 py-2 text-white ${
                disabledRequestButton == true
                  ? "opacity-50 cursor-not-allowed"
                  : "" ||
                    selectedFileType === null ||
                    selectedCameraType === null ||
                    selectedVehicle === null ||
                    (selectedFileType === "Video" &&
                      (selectedDate === null ||
                        selectedTime === "" ||
                        selectedduration === ""))
                  ? "disabled"
                  : ""
              }`}
              onClick={handleSubmit}
              disabled={
                selectedFileType === null ||
                selectedCameraType === null ||
                selectedVehicle === null ||
                (selectedFileType === "Video" &&
                  (selectedDate === null ||
                    selectedTime === "" ||
                    selectedduration === ""))
              }
            >
              Request
            </button>{" "}
            {/* <button
              className={`bg-green px-5 py-2 text-white `}
              // onClick={handleSubmit2}
            >
              check Status
            </button> */}
            <button
              className={`bg-green px-2 py-2 text-white  
                   ${disabledButton ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={handlecameraOn}
              disabled={disabledButton}
              style={{ marginLeft: "10px" }}
            >
              camera On
            </button>
          </div>
        </div>
        <br></br>
        <br></br>
        <div>
          {showDurationTab && (
            <div className="dateTimeForm lg:grid-cols-3">
              <form className="grid lg:grid-cols-3 md:grid-cols-3 sm:grid-cols-1 gap-2">
                <div className="formGroup lg:col-span-1 ">
                  <label htmlFor="date">Date:</label>
                  <Box
                    sx={{
                      width: "100%",
                      border: "1px solid #ccc",
                      borderBottom: "none",
                      paddingTop: "7px",
                    }}
                  >
                    <MuiPickersUtilsProvider utils={DateFnsMomentUtils}>
                      <DatePicker
                        format="MM/dd/yyyy"
                        value={selectedDate}
                        onChange={(item) => handlevideodate(item)}
                        variant="inline"
                        maxDate={currenTDates}
                        autoOk
                        style={{ width: "100%" }} // Set the width to 100% to fill the entire div
                        inputProps={{ readOnly: true }}
                        InputProps={{
                          endAdornment: (
                            <EventIcon style={{ width: "20", height: "20" }} />
                          ),
                        }}
                      />
                    </MuiPickersUtilsProvider>
                  </Box>
                </div>
                <div className="formGroup col-span-1">
                  <label htmlFor="time">Time:</label>
                  <input
                    type="time"
                    id="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    step="1"
                    onKeyPress={(e) => e.preventDefault()}
                  />
                </div>
                <div className="formGroup col-span-1">
                  <label htmlFor="time">Duration: (in seconds)</label>
                  <input
                    type="number"
                    id="Duration"
                    value={selectedduration}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^[1-9]$|^10$/.test(value)) {
                        setSelectedDuration(value);
                      }
                    }}
                    placeholder="Enter duration between 1-10 sec"
                    style={{ padding: "9px", border: "1px solid #ccc" }}
                  />
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
      <br></br>
      <br></br>
      <Toaster position="top-center" reverseOrder={false} />
    </div>
  );
}
