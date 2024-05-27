import { ResponseType } from "api/todolists-api";
import { Dispatch } from "redux";
import { appActions } from "app/app.reducer";
import { AppDispatch } from "../app/store";
import axios from "axios";

export const handleServerAppError = <D>(data: ResponseType<D>, dispatch: Dispatch) => {
  if (data.messages.length) {
    dispatch(appActions.setAppError({ error: data.messages[0] }));
  } else {
    dispatch(appActions.setAppError({ error: "Some error occurred" }));
  }
  dispatch(appActions.setAppStatus({ status: "failed" }));
};

export const handleServerNetworkError = (error: unknown, dispatch: AppDispatch) => {
  let errorMessage = "Some error occurred";
  if (axios.isAxiosError(error)) {
    errorMessage = error?.response?.data?.message || error?.message || errorMessage;
  } else if (error instanceof Error) {
    errorMessage = `Native error: ${error.message}`;
  } else {
    errorMessage = JSON.stringify(error);
  }

  dispatch(appActions.setAppError({ error: errorMessage }));
  dispatch(appActions.setAppStatus({ status: "failed" }));
};
