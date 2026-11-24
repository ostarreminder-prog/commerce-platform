import{j as e}from"./jsx-runtime-D_zvdyIk.js";import{r as p}from"./index-CkOfz6b4.js";import{c as m}from"./cn-BLSKlp9E.js";import{B as x}from"./button-Rc-0UiSC.js";import{S as j,a as w,c as S}from"./sheet-wjaaxkXH.js";import{c as g}from"./createLucideIcon-CeCWHmPF.js";import{S as q}from"./shopping-cart-BR-3Tsqt.js";import{P as M}from"./package-B-jOgb3Z.js";import"./index-Cvdn1Lp9.js";import"./index-EXTQMK5R.js";import"./index-XeZL9dmd.js";import"./index-BnIvjH4E.js";import"./index-Bzy2Am6L.js";import"./index-BtqBqbkd.js";import"./index-NkGiuGNq.js";import"./index-IaRJl6TI.js";import"./index-w84D0ue_.js";import"./index-UOIzNv_g.js";import"./index-CMsSILQJ.js";import"./index-BuaonsdZ.js";import"./index-l7gETg2p.js";import"./index-Bjpu_PlH.js";import"./index-DO5CUyDi.js";import"./react-DbW1txLS.js";import"./x-s1SdBNwc.js";/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const C=[["path",{d:"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8",key:"5wwlr5"}],["path",{d:"M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",key:"r6nss1"}]],L=g("house",C);/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const T=[["path",{d:"M4 5h16",key:"1tepv9"}],["path",{d:"M4 12h16",key:"1lakjw"}],["path",{d:"M4 19h16",key:"1djgab"}]],W=g("menu",T);function b({brand:n,nav:t,navLabel:a,openMenuLabel:i,actions:N,sidebarFooter:c,renderLink:v,children:k}){const[y,o]=p.useState(!1),l=d=>e.jsxs("div",{className:"flex h-full flex-col",children:[e.jsx("div",{className:m("flex h-16 items-center border-b px-5",d&&"pe-12"),children:n}),e.jsx("nav",{"aria-label":a,className:"flex-1 space-y-0.5 overflow-y-auto p-3",children:t.map(r=>{const R=r.icon;return e.jsx(p.Fragment,{children:v({href:r.href,onClick:d?()=>o(!1):void 0,"aria-current":r.active?"page":void 0,className:m("focus-visible:ring-ring flex h-9 items-center gap-3 rounded-md px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2",r.active?"bg-primary/10 text-primary font-medium":"text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"),children:e.jsxs(e.Fragment,{children:[e.jsx(R,{className:"size-4 shrink-0","aria-hidden":!0}),e.jsx("span",{className:"flex-1",children:r.label}),r.badge?e.jsx("span",{className:"num bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none",children:r.badge}):null]})})},r.href)})}),c?e.jsx("div",{className:"p-3",children:c}):null]});return e.jsxs("div",{className:"flex min-h-dvh",children:[e.jsx("aside",{className:"bg-sidebar text-sidebar-foreground border-sidebar-border sticky top-0 hidden h-dvh w-60 shrink-0 border-e lg:block",children:l(!1)}),e.jsx(j,{open:y,onOpenChange:o,children:e.jsxs(w,{side:"start",className:"bg-sidebar w-72 p-0 sm:max-w-72",children:[e.jsx(S,{className:"sr-only",children:a}),l(!0)]})}),e.jsxs("div",{className:"flex min-w-0 flex-1 flex-col",children:[e.jsxs("header",{className:"bg-background/85 sticky top-0 z-30 flex h-16 items-center gap-2 border-b px-4 backdrop-blur sm:px-6",children:[e.jsx(x,{variant:"ghost",size:"icon",className:"lg:hidden","aria-label":i,onClick:()=>o(!0),children:e.jsx(W,{"aria-hidden":!0})}),e.jsx("div",{className:"ms-auto flex items-center gap-1",children:N})]}),e.jsx("main",{className:"mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:py-8",children:k})]})]})}b.__docgenInfo={description:"Sidebar + topbar layout shared by the platform consoles.",methods:[],displayName:"WorkspaceShell",props:{brand:{required:!0,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},nav:{required:!0,tsType:{name:"Array",elements:[{name:"WorkspaceNavItem"}],raw:"WorkspaceNavItem[]"},description:""},navLabel:{required:!0,tsType:{name:"string"},description:""},openMenuLabel:{required:!0,tsType:{name:"string"},description:""},actions:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},sidebarFooter:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},renderLink:{required:!0,tsType:{name:"signature",type:"function",raw:'(props: { href: string; className: string; children: React.ReactNode; onClick?: () => void; "aria-current"?: "page" }) => React.ReactNode',signature:{arguments:[{type:{name:"signature",type:"object",raw:'{ href: string; className: string; children: React.ReactNode; onClick?: () => void; "aria-current"?: "page" }',signature:{properties:[{key:"href",value:{name:"string",required:!0}},{key:"className",value:{name:"string",required:!0}},{key:"children",value:{name:"ReactReactNode",raw:"React.ReactNode",required:!0}},{key:"onClick",value:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}},required:!1}},{key:"aria-current",value:{name:"literal",value:'"page"',required:!1}}]}},name:"props"}],return:{name:"ReactReactNode",raw:"React.ReactNode"}}},description:"Renders a navigation link (e.g. next/link) so the shell stays router-agnostic."},children:{required:!0,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""}}};const ne={title:"WorkspaceShell"},s={render:()=>e.jsx("div",{className:"h-96 border",children:e.jsx(b,{brand:e.jsx("span",{className:"font-bold",children:"Nakhla"}),navLabel:"Navigation",openMenuLabel:"Menu",nav:[{href:"/",label:"Home",icon:L,active:!0},{href:"/orders",label:"Orders",icon:q,badge:"3"},{href:"/products",label:"Products",icon:M}],renderLink:({href:n,className:t,children:a,...i})=>e.jsx("a",{href:n,className:t,...i,children:a}),actions:e.jsx(x,{size:"sm",children:"New"}),children:e.jsx("div",{className:"p-6 text-sm",children:"Workspace content goes here."})})})};var u,h,f;s.parameters={...s.parameters,docs:{...(u=s.parameters)==null?void 0:u.docs,source:{originalSource:`{
  render: () => <div className="h-96 border">
      <WorkspaceShell brand={<span className="font-bold">Nakhla</span>} navLabel="Navigation" openMenuLabel="Menu" nav={[{
      href: "/",
      label: "Home",
      icon: Home,
      active: true
    }, {
      href: "/orders",
      label: "Orders",
      icon: ShoppingCart,
      badge: "3"
    }, {
      href: "/products",
      label: "Products",
      icon: Package
    }]} renderLink={({
      href,
      className,
      children,
      ...rest
    }) => <a href={href} className={className} {...rest}>{children}</a>} actions={<Button size="sm">New</Button>}>
        <div className="p-6 text-sm">Workspace content goes here.</div>
      </WorkspaceShell>
    </div>
}`,...(f=(h=s.parameters)==null?void 0:h.docs)==null?void 0:f.source}}};const te=["Default"];export{s as Default,te as __namedExportsOrder,ne as default};
