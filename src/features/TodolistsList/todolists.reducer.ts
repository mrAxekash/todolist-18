import { todolistsAPI, TodolistType } from "api/todolists-api";
import { appActions, RequestStatusType } from "app/app.reducer";
import { handleServerNetworkError } from "utils/error-utils";
import { AppDispatch, AppRootStateType, AppThunk } from "app/store";
import { asyncThunkCreator, buildCreateSlice, PayloadAction } from "@reduxjs/toolkit";
import { clearTasksAndTodolists } from "common/actions/common.actions";

const createAppSlice = buildCreateSlice({
  creators: { asyncThunk: asyncThunkCreator },
});

const initialState: TodolistDomainType[] = [];

const slice = createAppSlice({
  name: "todo",
  initialState,
  reducers: (creators) => {
    const createAThunk = creators.asyncThunk.withTypes<{ rejectValue: null }>();
    return {
      removeTodolist: creators.reducer((state, action: PayloadAction<{ id: string }>) => {
        const index = state.findIndex((todo) => todo.id === action.payload.id);
        if (index !== -1) state.splice(index, 1);
      }),
      addTodolist: creators.reducer((state, action: PayloadAction<{ todolist: TodolistType }>) => {
        const newTodolist: TodolistDomainType = { ...action.payload.todolist, filter: "all", entityStatus: "idle" };
        state.unshift(newTodolist);
      }),
      changeTodolistTitle: creators.reducer((state, action: PayloadAction<{ id: string; title: string }>) => {
        const todo = state.find((todo) => todo.id === action.payload.id);
        if (todo) {
          todo.title = action.payload.title;
        }
      }),
      changeTodolistFilter: creators.reducer(
        (state, action: PayloadAction<{ id: string; filter: FilterValuesType }>) => {
          const todo = state.find((todo) => todo.id === action.payload.id);
          if (todo) {
            todo.filter = action.payload.filter;
          }
        },
      ),
      changeTodolistEntityStatus: creators.reducer(
        (
          state,
          action: PayloadAction<{
            id: string;
            entityStatus: RequestStatusType;
          }>,
        ) => {
          const todo = state.find((todo) => todo.id === action.payload.id);
          if (todo) {
            todo.entityStatus = action.payload.entityStatus;
          }
        },
      ),
      fetchTodolists: createAThunk<undefined, { todolists: TodolistType[] }>(
        async (_, thunkAPI) => {
          const { dispatch, rejectWithValue, getState } = thunkAPI;

          const appDispatch = dispatch as AppDispatch;
          const state = getState() as AppRootStateType;
          try {
            appDispatch(appActions.setAppStatus({ status: "loading" }));
            const res = await todolistsAPI.getTodolists();
            appDispatch(appActions.setAppStatus({ status: "succeeded" }));
            return { todolists: res.data };
          } catch (error) {
            handleServerNetworkError(error, appDispatch);
            return rejectWithValue(null);
          }
        },
        {
          fulfilled: (state, action: PayloadAction<{ todolists: TodolistType[] }>) => {
            return action.payload.todolists.map((tl) => ({ ...tl, filter: "all", entityStatus: "idle" }));
          },
        },
      ),
    };
  },
  extraReducers: (builder) => {
    builder.addCase(clearTasksAndTodolists, () => {
      return [];
    });
  },
});

export const todolistsReducer = slice.reducer;
export const todolistsActions = slice.actions;

// thunks

// export const fetchTodolistsTC = (): AppThunk => {
//   return (dispatch) => {
//     dispatch(appActions.setAppStatus({ status: "loading" }));
//     todolistsAPI
//       .getTodolists()
//       .then((res) => {
//         dispatch(todolistsActions.setTodolists({ todolists: res.data }));
//         dispatch(appActions.setAppStatus({ status: "succeeded" }));
//       })
//       .catch((error) => {
//         handleServerNetworkError(error, dispatch);
//       });
//   };
// };
export const removeTodolistTC = (id: string): AppThunk => {
  return (dispatch) => {
    //изменим глобальный статус приложения, чтобы вверху полоса побежала
    dispatch(appActions.setAppStatus({ status: "loading" }));
    //изменим статус конкретного тудулиста, чтобы он мог задизеблить что надо
    dispatch(todolistsActions.changeTodolistEntityStatus({ id, entityStatus: "loading" }));
    todolistsAPI.deleteTodolist(id).then((res) => {
      dispatch(todolistsActions.removeTodolist({ id }));
      //скажем глобально приложению, что асинхронная операция завершена
      dispatch(appActions.setAppStatus({ status: "succeeded" }));
    });
  };
};
export const addTodolistTC = (title: string): AppThunk => {
  return (dispatch) => {
    dispatch(appActions.setAppStatus({ status: "loading" }));
    todolistsAPI.createTodolist(title).then((res) => {
      dispatch(todolistsActions.addTodolist({ todolist: res.data.data.item }));
      dispatch(appActions.setAppStatus({ status: "succeeded" }));
    });
  };
};
export const changeTodolistTitleTC = (id: string, title: string): AppThunk => {
  return (dispatch) => {
    todolistsAPI.updateTodolist(id, title).then((res) => {
      dispatch(todolistsActions.changeTodolistTitle({ id, title }));
    });
  };
};

// types
export type FilterValuesType = "all" | "active" | "completed";
export type TodolistDomainType = TodolistType & {
  filter: FilterValuesType;
  entityStatus: RequestStatusType;
};
