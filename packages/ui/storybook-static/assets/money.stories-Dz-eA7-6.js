import{j as e}from"./jsx-runtime-D_zvdyIk.js";import{c}from"./cn-BLSKlp9E.js";import{f as d}from"./format-DgOK1iWh.js";import{Z as l}from"./react-DbW1txLS.js";import"./index-CkOfz6b4.js";function r({amount:t,className:p,...i}){const m=l();return e.jsx("span",{className:c("num whitespace-nowrap",p),children:d(t,m,i)})}r.__docgenInfo={description:"",methods:[],displayName:"Money",props:{hideCurrency:{required:!1,tsType:{name:"boolean"},description:"Hide the currency label (e.g. inside a column already labelled SAR)."},amount:{required:!0,tsType:{name:"number"},description:"Integer amount in halalas."},className:{required:!1,tsType:{name:"string"},description:""}}};const j={title:"Money"},n={render:()=>e.jsxs("div",{className:"space-y-2 p-6 text-lg",children:[e.jsx("p",{children:e.jsx(r,{amount:14950})}),e.jsx("p",{children:e.jsx(r,{amount:1299900})}),e.jsx("p",{children:e.jsx(r,{amount:0})})]})};var a,s,o;n.parameters={...n.parameters,docs:{...(a=n.parameters)==null?void 0:a.docs,source:{originalSource:`{
  render: () => <div className="space-y-2 p-6 text-lg">
      <p><Money amount={14950} /></p>
      <p><Money amount={1299900} /></p>
      <p><Money amount={0} /></p>
    </div>
}`,...(o=(s=n.parameters)==null?void 0:s.docs)==null?void 0:o.source}}};const g=["Default"];export{n as Default,g as __namedExportsOrder,j as default};
