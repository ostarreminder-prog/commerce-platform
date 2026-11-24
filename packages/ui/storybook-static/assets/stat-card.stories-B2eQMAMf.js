import{j as e}from"./jsx-runtime-D_zvdyIk.js";import{c as d}from"./cn-BLSKlp9E.js";import{b as S}from"./format-DgOK1iWh.js";import{C as v}from"./card-1qMID3-6.js";import{S as i}from"./skeleton-Ch-3sKez.js";import{c}from"./createLucideIcon-CeCWHmPF.js";import{S as b}from"./shopping-cart-BR-3Tsqt.js";import"./index-CkOfz6b4.js";/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const w=[["path",{d:"M16 17h6v-6",key:"t6n2it"}],["path",{d:"m22 17-8.5-8.5-5 5L2 7",key:"x473p"}]],C=c("trending-down",w);/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _=[["path",{d:"M16 7h6v6",key:"box55l"}],["path",{d:"m22 7-8.5 8.5-5-5L2 17",key:"1t1m79"}]],k=c("trending-up",_);/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const T=[["path",{d:"M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1",key:"18etb6"}],["path",{d:"M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4",key:"xoc0q4"}]],q=c("wallet",T);function o({label:r,value:j,icon:l,delta:s,hint:n,className:y}){const m=(s??0)>=0;return e.jsxs(v,{className:d("p-5",y),children:[e.jsxs("div",{className:"flex items-start justify-between gap-3",children:[e.jsx("p",{className:"text-muted-foreground text-sm",children:r}),l?e.jsx("span",{className:"bg-primary/10 text-primary flex size-9 items-center justify-center rounded-md",children:e.jsx(l,{className:"size-4","aria-hidden":!0})}):null]}),e.jsx("p",{className:"num mt-2 whitespace-nowrap text-xl font-semibold sm:text-2xl",children:j}),s!==void 0||n?e.jsxs("div",{className:"mt-2 flex items-center gap-2 text-xs",children:[s!==void 0?e.jsxs("span",{className:d("num inline-flex items-center gap-1 font-medium",m?"text-success":"text-destructive"),children:[m?e.jsx(k,{className:"size-3.5","aria-hidden":!0}):e.jsx(C,{className:"size-3.5","aria-hidden":!0}),S(Math.abs(s))]}):null,n?e.jsx("span",{className:"text-muted-foreground",children:n}):null]}):null]})}function N({className:r}){return e.jsxs(v,{className:d("space-y-3 p-5",r),children:[e.jsx(i,{className:"h-4 w-24"}),e.jsx(i,{className:"h-7 w-32"}),e.jsx(i,{className:"h-3 w-20"})]})}o.__docgenInfo={description:"",methods:[],displayName:"StatCard",props:{label:{required:!0,tsType:{name:"string"},description:""},value:{required:!0,tsType:{name:"string"},description:""},icon:{required:!1,tsType:{name:"LucideIcon"},description:""},delta:{required:!1,tsType:{name:"number"},description:"Change ratio vs. previous period, e.g. 0.12 for +12%."},hint:{required:!1,tsType:{name:"string"},description:""},className:{required:!1,tsType:{name:"string"},description:""}}};N.__docgenInfo={description:"",methods:[],displayName:"StatCardSkeleton",props:{className:{required:!1,tsType:{name:"string"},description:""}}};const E={title:"StatCard"},a={render:()=>e.jsxs("div",{className:"grid max-w-2xl grid-cols-2 gap-4 p-6",children:[e.jsx(o,{label:"Revenue",value:"SAR 24,600",icon:q,delta:.12,hint:"vs last month"}),e.jsx(o,{label:"Orders",value:"312",icon:b,delta:-.04})]})},t={render:()=>e.jsx("div",{className:"max-w-xs p-6",children:e.jsx(N,{})})};var p,u,x;a.parameters={...a.parameters,docs:{...(p=a.parameters)==null?void 0:p.docs,source:{originalSource:`{
  render: () => <div className="grid max-w-2xl grid-cols-2 gap-4 p-6">
      <StatCard label="Revenue" value="SAR 24,600" icon={Wallet} delta={0.12} hint="vs last month" />
      <StatCard label="Orders" value="312" icon={ShoppingCart} delta={-0.04} />
    </div>
}`,...(x=(u=a.parameters)==null?void 0:u.docs)==null?void 0:x.source}}};var h,f,g;t.parameters={...t.parameters,docs:{...(h=t.parameters)==null?void 0:h.docs,source:{originalSource:`{
  render: () => <div className="max-w-xs p-6"><StatCardSkeleton /></div>
}`,...(g=(f=t.parameters)==null?void 0:f.docs)==null?void 0:g.source}}};const W=["Default","Loading"];export{a as Default,t as Loading,W as __namedExportsOrder,E as default};
