// Import Internal Dependencies
import { createDOMElement } from "../../common/utils";

export function createFileBox(options = {}) {
  const { title, fileName, childs = [], titleHref = "#", fileHref = null, severity = null } = options;

  const defaultHrefProperties = { target: "_blank", rel: "noopener noreferrer" };
  const fileDomElement = fileHref === null ?
    createDOMElement("p", { text: fileName }) :
    createDOMElement("a", { text: fileName, attributes: { href: fileHref, ...defaultHrefProperties } });

  const boxHeader = createDOMElement("div", {
    classList: ["box-header"],
    childs: [
      ...(severity === null ? [] : [
        createDOMElement("span", { classList: [severity], text: severity.charAt(0).toUpperCase() })
      ]),
      titleHref === null ?
        createDOMElement("p", { text: title, className: "box-title" }) :
        createDOMElement("a", {
          text: title,
          className: "box-title",
          attributes: {
            href: titleHref, ...defaultHrefProperties
          }
        }),
      createDOMElement("p", {
        className: "box-file",
        childs: [
          createDOMElement("i", { classList: ["icon-docs"] }),
          fileDomElement
        ]
      })
    ]
  });

  return createDOMElement("div", {
    classList: ["box-file-info"],
    childs: [
      boxHeader,
      ...childs.filter((element) => element !== null)
    ]
  });
}
