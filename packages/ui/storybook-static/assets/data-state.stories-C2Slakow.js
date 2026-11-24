import{j as e}from"./jsx-runtime-D_zvdyIk.js";import{E as T}from"./error-state-CcK8rena.js";import{S as E}from"./skeleton-Ch-3sKez.js";import"./cn-BLSKlp9E.js";import"./button-Rc-0UiSC.js";import"./index-CkOfz6b4.js";import"./index-Cvdn1Lp9.js";import"./index-EXTQMK5R.js";import"./createLucideIcon-CeCWHmPF.js";import"./index-DO5CUyDi.js";import"./react-DbW1txLS.js";import"./triangle-alert-D0CESF8f.js";import"./rotate-cw-CGgHL1Fp.js";function a({state:t,loading:r,empty:m,isEmpty:c,error:p,children:w}){return t.status==="pending"?e.jsx(e.Fragment,{children:r}):t.status==="error"||t.data===void 0?e.jsx(e.Fragment,{children:p?p(t.refetch):e.jsx(T,{onRetry:t.refetch,retrying:t.isRefetching})}):m&&(c!=null&&c(t.data))?e.jsx(e.Fragment,{children:m}):e.jsx(e.Fragment,{children:w(t.data)})}a.__docgenInfo={description:"Renders exactly one of the four screen states: loading, error, empty, data.",methods:[],displayName:"DataState",props:{state:{required:!0,tsType:{name:"AsyncState",elements:[{name:"T"}],raw:"AsyncState<T>"},description:""},loading:{required:!0,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},empty:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},isEmpty:{required:!1,tsType:{name:"signature",type:"function",raw:"(data: T) => boolean",signature:{arguments:[{type:{name:"T"},name:"data"}],return:{name:"boolean"}}},description:""},error:{required:!1,tsType:{name:"signature",type:"function",raw:"(retry: (() => unknown) | undefined) => React.ReactNode",signature:{arguments:[{type:{name:"union",raw:"(() => unknown) | undefined",elements:[{name:"unknown"},{name:"undefined"}]},name:"retry"}],return:{name:"ReactReactNode",raw:"React.ReactNode"}}},description:""},children:{required:!0,tsType:{name:"signature",type:"function",raw:"(data: T) => React.ReactNode",signature:{arguments:[{type:{name:"T"},name:"data"}],return:{name:"ReactReactNode",raw:"React.ReactNode"}}},description:""}}};const G={title:"DataState"},i=e.jsx(E,{className:"h-24 w-64"}),n={render:()=>e.jsx(a,{state:{status:"pending",data:void 0},loading:i,children:t=>e.jsx("p",{children:t.join(", ")})})},s={render:()=>e.jsx(a,{state:{status:"error",data:void 0,refetch:()=>{}},loading:i,children:t=>e.jsx("p",{children:t.join(", ")})})},o={render:()=>e.jsx(a,{state:{status:"success",data:[]},loading:i,isEmpty:t=>t.length===0,empty:e.jsx("p",{className:"text-muted-foreground p-6 text-sm",children:"Nothing here yet."}),children:t=>e.jsx("p",{children:t.join(", ")})})},d={render:()=>e.jsx(a,{state:{status:"success",data:["Coffee","Dates"]},loading:i,children:t=>e.jsx("ul",{className:"list-inside list-disc p-4",children:t.map(r=>e.jsx("li",{children:r},r))})})};var u,l,g;n.parameters={...n.parameters,docs:{...(u=n.parameters)==null?void 0:u.docs,source:{originalSource:`{
  render: () => <DataState<string[]> state={{
    status: "pending",
    data: undefined
  }} loading={loadingNode}>{d => <p>{d.join(", ")}</p>}</DataState>
}`,...(g=(l=n.parameters)==null?void 0:l.docs)==null?void 0:g.source}}};var f,h,x;s.parameters={...s.parameters,docs:{...(f=s.parameters)==null?void 0:f.docs,source:{originalSource:`{
  render: () => <DataState<string[]> state={{
    status: "error",
    data: undefined,
    refetch: () => {}
  }} loading={loadingNode}>{d => <p>{d.join(", ")}</p>}</DataState>
}`,...(x=(h=s.parameters)==null?void 0:h.docs)==null?void 0:x.source}}};var y,j,R;o.parameters={...o.parameters,docs:{...(y=o.parameters)==null?void 0:y.docs,source:{originalSource:`{
  render: () => <DataState<string[]> state={{
    status: "success",
    data: []
  }} loading={loadingNode} isEmpty={d => d.length === 0} empty={<p className="text-muted-foreground p-6 text-sm">Nothing here yet.</p>}>
      {d => <p>{d.join(", ")}</p>}
    </DataState>
}`,...(R=(j=o.parameters)==null?void 0:j.docs)==null?void 0:R.source}}};var N,S,D;d.parameters={...d.parameters,docs:{...(N=d.parameters)==null?void 0:N.docs,source:{originalSource:`{
  render: () => <DataState<string[]> state={{
    status: "success",
    data: ["Coffee", "Dates"]
  }} loading={loadingNode}>
      {d => <ul className="list-inside list-disc p-4">{d.map(x => <li key={x}>{x}</li>)}</ul>}
    </DataState>
}`,...(D=(S=d.parameters)==null?void 0:S.docs)==null?void 0:D.source}}};const H=["Loading","Error","Empty","Data"];export{d as Data,o as Empty,s as Error,n as Loading,H as __namedExportsOrder,G as default};
