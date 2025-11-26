// Import Third-party Dependencies
import { css } from "lit";

export const scrollbarStyle = css`
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
  border-radius: 4px;
}

::-webkit-scrollbar-track-piece {
  /* Fond */
  background: transparent none;
  border: solid 4px transparent;
  border-right-width: 6px;
  margin: 4px;
}

::-webkit-scrollbar-track-piece:horizontal {
  /* Fond pour la barre du bas */
  border-right-width: 4px;
  border-bottom-width: 8px;
}

::-webkit-scrollbar-thumb {
  /* Barre */
  border: solid 0 transparent;
  border-right-width: 4px;
  border-radius: 5px;
  border-top-right-radius: 9px 5px;
  border-bottom-right-radius: 9px 5px;
  box-shadow: inset 0 0 0 1px #3722AF,
    inset 0 0 0 6px #3f27c7;
}

::-webkit-scrollbar-thumb:horizontal {
  /* Barre du bas */
  border-right-width: 0;
  border-bottom-width: 4px;
  border-top-right-radius: 5px;
  border-bottom-right-radius: 5px 9px;
  border-bottom-left-radius: 5px 9px;
}
`;
