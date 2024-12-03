import * as React from "react";
import { useEffect, useRef, useState } from "react";
import {
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  IconButton,
  ITextField,
  PrimaryButton,
  Stack,
  Text,
  TextField,
} from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";

import { historyRename, historyDelete } from "../../api/api";
// import _ from 'lodash';

import styles from "./ChatHistoryListItemCell.module.css";
import { Conversation } from "../../types/AppTypes";
import { useAppContext } from "../../state/useAppContext";
import { actionConstants } from "../../state/ActionConstants";

interface ChatHistoryListItemCellProps {
  item?: Conversation;
  onSelect: (item: Conversation | null) => void;
  // onHistoryDelete: (id: string) => void;
  toggleToggleSpinner: (toggler: boolean) => void;
}

export const ChatHistoryListItemCell: React.FC<
  ChatHistoryListItemCellProps
> = ({
  item,
  onSelect,
  // onHistoryDelete,
  toggleToggleSpinner,
}) => {
  const { state, dispatch } = useAppContext();
  const [isHovered, setIsHovered] = React.useState(false);
  const [edit, setEdit] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [hideDeleteDialog, { toggle: toggleDeleteDialog }] = useBoolean(true);
  const [errorDelete, setErrorDelete] = useState(false);
  const [renameLoading, setRenameLoading] = useState(false);
  const [errorRename, setErrorRename] = useState<string | undefined>(undefined);
  const [textFieldFocused, setTextFieldFocused] = useState(false);
  const textFieldRef = useRef<ITextField | null>(null);
  const isSelected = item?.id === state.selectedConversationId;
  const dialogContentProps = {
    type: DialogType.close,
    title: "Are you sure you want to delete this item?",
    closeButtonAriaLabel: "Close",
    subText: "The history of this chat session will be permanently removed.",
  };

  const modalProps = {
    titleAriaId: "labelId",
    subtitleAriaId: "subTextId",
    isBlocking: true,
    styles: { main: { maxWidth: 450 } },
  };

  useEffect(() => {
    if (textFieldFocused && textFieldRef.current) {
      textFieldRef.current.focus();
      setTextFieldFocused(false);
    }
  }, [textFieldFocused]);

  if (!item) {
    return null;
  }

  const onDelete = async () => {
    console.log('onDelete:::',item.id)
    toggleToggleSpinner(true);
    const response = await historyDelete(item.id);
    console.log('onDelete:response::',response)
    if (!response.ok) {
      setErrorDelete(true);
      setTimeout(() => {
        setErrorDelete(false);
      }, 5000);
    } else {
      dispatch({
        type: actionConstants.DELETE_CONVERSATION_FROM_LIST,
        payload: item.id,
      });
    }
    toggleDeleteDialog();
    toggleToggleSpinner(false);
  };

  const onEdit = () => {
    setEdit(true);
    setTextFieldFocused(true);
    setEditTitle(item?.title);
  };

  const handleSelectItem = () => {
    onSelect(item);
  };

  const truncatedTitle =
    item?.title?.length > 28
      ? `${item.title.substring(0, 28)} ...`
      : item.title;

  const handleSaveEdit = async (e: any) => {
    e.preventDefault();
    if (errorRename || renameLoading) {
      return;
    }

    if (editTitle.trim() === item?.title?.trim()) {
      setEdit(false);
      setTextFieldFocused(false);
      return;
    }
    setRenameLoading(true);
    const response = await historyRename(item.id, editTitle);
    if (!response.ok) {
      setErrorRename("Error: could not rename item");
      setTimeout(() => {
        setTextFieldFocused(true);
        setErrorRename(undefined);
        if (textFieldRef.current) {
          textFieldRef.current.focus();
        }
      }, 5000);
      setRenameLoading(false);
    } else {
      setRenameLoading(false);
      setEdit(false);
      setEditTitle("");
      dispatch({
        type: actionConstants.UPDATE_CONVERSATION_TITLE,
        payload: { id: item?.id, newTitle: editTitle },
      });
    }
  };

  const chatHistoryTitleOnChange = (e: any) => {
    setEditTitle(e.target.value);
  };

  const cancelEditTitle = () => {
    setEdit(false);
    setEditTitle("");
  };

  const handleKeyPressEdit = (e: any) => {
    if (e.key === "Enter") {
      return handleSaveEdit(e);
    }
    if (e.key === "Escape") {
      cancelEditTitle();
      return;
    }
  };
  const onClickDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    toggleDeleteDialog();
  };
  const isButtonDisabled = state.chat.generatingResponse && isSelected;
  return (
    <Stack
      key={item.id}
      tabIndex={0}
      aria-label="chat history item"
      className={styles.itemCell}
      onClick={() => handleSelectItem()}
      onKeyDown={(e) =>
        e.key === "Enter" || e.key === " " ? handleSelectItem() : null
      }
      verticalAlign="center"
      // horizontal
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      styles={{
        root: {
          backgroundColor: isSelected ? "#e6e6e6" : "transparent",
        },
      }}
    >
      {edit ? (
        <>
          <Stack.Item style={{ width: "100%" }}>
            <form
              aria-label="edit title form"
              onSubmit={(e) => handleSaveEdit(e)}
              style={{ padding: "5px 0px" }}
            >
              <Stack horizontal verticalAlign={"start"}>
                <Stack.Item>
                  <TextField
                    componentRef={textFieldRef}
                    autoFocus={textFieldFocused}
                    value={editTitle}
                    placeholder={item.title}
                    onChange={chatHistoryTitleOnChange}
                    onKeyDown={handleKeyPressEdit}
                    errorMessage={errorRename}
                    disabled={errorRename ? true : false}
                    title={editTitle}
                  />
                </Stack.Item>
                {editTitle && (
                  <Stack.Item>
                    <Stack
                      aria-label="action button group"
                      horizontal
                      verticalAlign={"center"}
                    >
                      <IconButton
                        role="button"
                        disabled={errorRename !== undefined}
                        onKeyDown={(e) =>
                          e.key === " " || e.key === "Enter"
                            ? handleSaveEdit(e)
                            : null
                        }
                        onClick={(e) => handleSaveEdit(e)}
                        aria-label="confirm new title"
                        iconProps={{ iconName: "CheckMark" }}
                        styles={{ root: { color: "green", marginLeft: "5px" } }}
                      />
                      <IconButton
                        role="button"
                        disabled={errorRename !== undefined}
                        onKeyDown={(e) =>
                          e.key === " " || e.key === "Enter"
                            ? cancelEditTitle()
                            : null
                        }
                        onClick={() => cancelEditTitle()}
                        aria-label="cancel edit title"
                        iconProps={{ iconName: "Cancel" }}
                        styles={{ root: { color: "red", marginLeft: "5px" } }}
                      />
                    </Stack>
                  </Stack.Item>
                )}
              </Stack>
            </form>
          </Stack.Item>
        </>
      ) : (
        <>
          <Stack
            horizontal
            verticalAlign={"center"}
            className={styles.chatHistoryItem}
            title={item?.title}
          >
            <div
              className={styles.chatTitle}
              style={{ width: isHovered || isSelected ? "68%" : "100%" }}
            >
              {truncatedTitle}
            </div>
            {(isHovered || isSelected) && (
              <Stack
                horizontal
                horizontalAlign="end"
                className={styles.chatHistoryItemsButtonsContainer}
              >
                <IconButton
                  className={styles.itemButton}
                  disabled={isButtonDisabled}
                  iconProps={{ iconName: "Delete" }}
                  title="Delete"
                  onClick={onClickDelete}
                  onKeyDown={(e) =>
                    e.key === " " ? toggleDeleteDialog() : null
                  }
                />
                <IconButton
                  className={styles.itemButton}
                  disabled={isButtonDisabled}
                  iconProps={{ iconName: "Edit" }}
                  title="Edit"
                  onClick={onEdit}
                  onKeyDown={(e) => (e.key === " " ? onEdit() : null)}
                />
              </Stack>
            )}
          </Stack>
        </>
      )}
      {errorDelete && (
        <Text
          styles={{
            root: { color: "red", marginTop: 5, fontSize: 14 },
          }}
        >
          Error: could not delete item
        </Text>
      )}
      <Dialog
        hidden={hideDeleteDialog}
        onDismiss={toggleDeleteDialog}
        dialogContentProps={dialogContentProps}
        modalProps={modalProps}
      >
        <DialogFooter>
          <PrimaryButton onClick={onDelete} text="Delete" />
          <DefaultButton onClick={toggleDeleteDialog} text="Cancel" />
        </DialogFooter>
      </Dialog>
    </Stack>
  );
};