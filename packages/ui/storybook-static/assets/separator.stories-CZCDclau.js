import{j as e}from"./jsx-runtime-D_zvdyIk.js";import{r as h}from"./index-CkOfz6b4.js";import{P as z}from"./index-UOIzNv_g.js";import{c as E}from"./cn-BLSKlp9E.js";import"./index-CMsSILQJ.js";import"./index-BuaonsdZ.js";import"./index-Cvdn1Lp9.js";var V=Object.defineProperty,j=(a,r)=>V(a,"name",{value:r,configurable:!0}),p={Horizontal:"horizontal",Vertical:"vertical"},m=p.Horizontal,b=Object.values(p),g=h.forwardRef(j(function(r,i){const{decorative:c,orientation:t=m,...O}=r,l=S(t)?t:m,_=l===p.Vertical?l:void 0,w=c?{role:"none"}:{"aria-orientation":_,role:"separator"};return e.jsx(z.div,{"data-orientation":l,...w,...O,ref:i})},"Separator"));function S(a){return b.includes(a)}j(S,"isValidOrientation");const n=h.forwardRef(({className:a,orientation:r="horizontal",decorative:i=!0,...c},t)=>e.jsx(g,{ref:t,decorative:i,orientation:r,className:E("bg-border shrink-0",r==="horizontal"?"h-px w-full":"h-full w-px",a),...c}));n.displayName="Separator";n.__docgenInfo={description:"",methods:[],displayName:"Separator",props:{orientation:{defaultValue:{value:'"horizontal"',computed:!1},required:!1},decorative:{defaultValue:{value:"true",computed:!1},required:!1}}};const q={title:"Separator"},o={render:()=>e.jsxs("div",{className:"w-64 space-y-3 p-6",children:[e.jsx("p",{className:"text-sm",children:"Above"}),e.jsx(n,{}),e.jsx("p",{className:"text-sm",children:"Below"})]})},s={render:()=>e.jsxs("div",{className:"flex h-8 items-center gap-3 p-6",children:[e.jsx("span",{className:"text-sm",children:"Start"}),e.jsx(n,{orientation:"vertical"}),e.jsx("span",{className:"text-sm",children:"End"})]})};var d,u,x;o.parameters={...o.parameters,docs:{...(d=o.parameters)==null?void 0:d.docs,source:{originalSource:`{
  render: () => <div className="w-64 space-y-3 p-6">
      <p className="text-sm">Above</p>
      <Separator />
      <p className="text-sm">Below</p>
    </div>
}`,...(x=(u=o.parameters)==null?void 0:u.docs)==null?void 0:x.source}}};var f,v,N;s.parameters={...s.parameters,docs:{...(f=s.parameters)==null?void 0:f.docs,source:{originalSource:`{
  render: () => <div className="flex h-8 items-center gap-3 p-6">
      <span className="text-sm">Start</span>
      <Separator orientation="vertical" />
      <span className="text-sm">End</span>
    </div>
}`,...(N=(v=s.parameters)==null?void 0:v.docs)==null?void 0:N.source}}};const B=["Horizontal","Vertical"];export{o as Horizontal,s as Vertical,B as __namedExportsOrder,q as default};
