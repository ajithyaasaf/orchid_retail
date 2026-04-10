## Error Type
Console Error

## Error Message
A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

https://react.dev/link/hydration-mismatch

  ...
    <HotReload globalError={[...]} webSocket={WebSocket} staticIndicatorState={{pathname:null, ...}}>
      <AppDevOverlayErrorBoundary globalError={[...]}>
        <ReplaySsrOnlyErrors>
        <DevRootHTTPAccessFallbackBoundary>
          <HTTPAccessFallbackBoundary notFound={<NotAllowedRootHTTPFallbackError>}>
            <HTTPAccessFallbackErrorBoundary pathname="/" notFound={<NotAllowedRootHTTPFallbackError>} ...>
              <RedirectBoundary>
                <RedirectErrorBoundary router={{...}}>
                  <Head>
                  <__next_root_layout_boundary__>
                    <SegmentViewNode type="layout" pagePath="layout.tsx">
                      <SegmentTrieNode>
                      <link>
                      <script>
                      <script>
                      <script>
                      <RootLayout>
                        <html lang="en" className="inter_c15e...">
                          <body
                            className="min-h-screen flex flex-col font-sans antialiased"
-                           __processed_ea89dce1-bb5d-46e0-bf3a-7da36d685e9c__="true"
-                           bis_register="W3sibWFzdGVyIjp0cnVlLCJleHRlbnNpb25JZCI6ImVwcGlvY2VtaG1ubGJoanBsY2drb2ZjaWll..."
                          >
                            <Header>
                            ...
                              <HomePage>
                                <HeroBanner>
                                  <section className="relative w...">
                                    <div
                                      className="absolute inset-0 transition-all duration-700 ease-in-out bg-gradient-..."
-                                     bis_skin_checked="1"
                                    >
                                      <div
                                        className="container h-full flex items-center"
-                                       bis_skin_checked="1"
                                      >
                                        <div
                                          className="max-w-xl text-white space-y-4 md:space-y-6"
-                                         bis_skin_checked="1"
                                        >
                                      <div
                                        className="absolute -right-20 -bottom-20 w-[500px] h-[500px] rounded-full bg-w..."
-                                       bis_skin_checked="1"
                                      >
                                      <div
                                        className="absolute right-20 top-10 w-[200px] h-[200px] rounded-full bg-white/5"
-                                       bis_skin_checked="1"
                                      >
                                    <div
                                      className="absolute inset-0 transition-all duration-700 ease-in-out bg-gradient-..."
-                                     bis_skin_checked="1"
                                    >
                                      <div
                                        className="container h-full flex items-center"
-                                       bis_skin_checked="1"
                                      >
                                        <div
                                          className="max-w-xl text-white space-y-4 md:space-y-6"
-                                         bis_skin_checked="1"
                                        >
                                      <div
                                        className="absolute -right-20 -bottom-20 w-[500px] h-[500px] rounded-full bg-w..."
-                                       bis_skin_checked="1"
                                      >
                                      <div
                                        className="absolute right-20 top-10 w-[200px] h-[200px] rounded-full bg-white/5"
-                                       bis_skin_checked="1"
                                      >
                                    <div
                                      className="absolute inset-0 transition-all duration-700 ease-in-out bg-gradient-..."
-                                     bis_skin_checked="1"
                                    >
                                      <div
                                        className="container h-full flex items-center"
-                                       bis_skin_checked="1"
                                      >
                                        <div
                                          className="max-w-xl text-white space-y-4 md:space-y-6"
-                                         bis_skin_checked="1"
                                        >
                                      <div
                                        className="absolute -right-20 -bottom-20 w-[500px] h-[500px] rounded-full bg-w..."
-                                       bis_skin_checked="1"
                                      >
                                      <div
                                        className="absolute right-20 top-10 w-[200px] h-[200px] rounded-full bg-white/5"
-                                       bis_skin_checked="1"
                                      >
                                    <button>
                                    <button>
                                    <div
                                      className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5"
-                                     bis_skin_checked="1"
                                    >
                                <CategoryStrip>
                                  <section className="py-10 md:p...">
                                    <div
                                      className="container"
-                                     bis_skin_checked="1"
                                    >
                                      <h2>
                                      <div
                                        className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 ..."
-                                       bis_skin_checked="1"
                                      >
                                        <LinkComponent href="/category/..." className="flex flex-...">
                                          <a className="flex flex-..." ref={function} onClick={function onClick} ...>
                                            <div
                                              className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary-light flex ..."
-                                             bis_skin_checked="1"
                                            >
+                                             👚
                                            ...
                                        <LinkComponent href="/category/..." className="flex flex-...">
                                          <a className="flex flex-..." ref={function} onClick={function onClick} ...>
                                            <div
                                              className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary-light flex ..."
-                                             bis_skin_checked="1"
                                            >
+                                             👗
                                            ...
                                        <LinkComponent href="/category/..." className="flex flex-...">
                                          <a className="flex flex-..." ref={function} onClick={function onClick} ...>
                                            <div
                                              className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary-light flex ..."
-                                             bis_skin_checked="1"
                                            >
+                                             👖
                                            ...
                                        <LinkComponent href="/category/..." className="flex flex-...">
                                          <a className="flex flex-..." ref={function} onClick={function onClick} ...>
                                            <div
                                              className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary-light flex ..."
-                                             bis_skin_checked="1"
                                            >
+                                             👔
                                            ...
                                        <LinkComponent href="/category/..." className="flex flex-...">
                                          <a className="flex flex-..." ref={function} onClick={function onClick} ...>
                                            <div
                                              className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary-light flex ..."
-                                             bis_skin_checked="1"
                                            >
+                                             🩳
                                            ...
                                        <LinkComponent href="/category/..." className="flex flex-...">
                                          <a className="flex flex-..." ref={function} onClick={function onClick} ...>
                                            <div
                                              className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary-light flex ..."
-                                             bis_skin_checked="1"
                                            >
+                                             🧒
                                            ...
                                        <LinkComponent href="/category/..." className="flex flex-...">
                                          <a className="flex flex-..." ref={function} onClick={function onClick} ...>
                                            <div
                                              className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary-light flex ..."
-                                             bis_skin_checked="1"
                                            >
+                                             👜
                                            ...
                                        <LinkComponent href="/category/..." className="flex flex-...">
                                          <a className="flex flex-..." ref={function} onClick={function onClick} ...>
                                            <div
                                              className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary-light flex ..."
-                                             bis_skin_checked="1"
                                            >
+                                             👟
                                            ...
                                <ProductSection title="New Arrivals" subtitle="Fresh surp..." limit={8}>
                                  <section className="py-10 md:p...">
                                    <div
                                      className="container"
-                                     bis_skin_checked="1"
                                    >
                                      <div
                                        className="text-center mb-8 md:mb-10"
-                                       bis_skin_checked="1"
                                      >
                                      <div
                                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
-                                       bis_skin_checked="1"
                                      >
                                        <div
                                          className="space-y-3"
-                                         bis_skin_checked="1"
                                        >
                                          <div
                                            className="aspect-[3/4] rounded-xl skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                          <div
                                            className="h-4 w-3/4 rounded skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                          <div
                                            className="h-4 w-1/2 rounded skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                        <div
                                          className="space-y-3"
-                                         bis_skin_checked="1"
                                        >
                                          <div
                                            className="aspect-[3/4] rounded-xl skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                          <div
                                            className="h-4 w-3/4 rounded skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                          <div
                                            className="h-4 w-1/2 rounded skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                        <div
                                          className="space-y-3"
-                                         bis_skin_checked="1"
                                        >
                                          <div
                                            className="aspect-[3/4] rounded-xl skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                          <div
                                            className="h-4 w-3/4 rounded skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                          <div
                                            className="h-4 w-1/2 rounded skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                        <div
                                          className="space-y-3"
-                                         bis_skin_checked="1"
                                        >
                                          <div
                                            className="aspect-[3/4] rounded-xl skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                          <div
                                            className="h-4 w-3/4 rounded skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                          <div
                                            className="h-4 w-1/2 rounded skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                        <div
                                          className="space-y-3"
-                                         bis_skin_checked="1"
                                        >
                                          <div
                                            className="aspect-[3/4] rounded-xl skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                          <div
                                            className="h-4 w-3/4 rounded skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                          <div
                                            className="h-4 w-1/2 rounded skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                        <div
                                          className="space-y-3"
-                                         bis_skin_checked="1"
                                        >
                                          <div
                                            className="aspect-[3/4] rounded-xl skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                          <div
                                            className="h-4 w-3/4 rounded skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                          <div
                                            className="h-4 w-1/2 rounded skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                        <div
                                          className="space-y-3"
-                                         bis_skin_checked="1"
                                        >
                                          <div
                                            className="aspect-[3/4] rounded-xl skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                          <div
                                            className="h-4 w-3/4 rounded skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                          <div
                                            className="h-4 w-1/2 rounded skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                        <div
                                          className="space-y-3"
-                                         bis_skin_checked="1"
                                        >
                                          <div
                                            className="aspect-[3/4] rounded-xl skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                          <div
                                            className="h-4 w-3/4 rounded skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                          <div
                                            className="h-4 w-1/2 rounded skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                <TrustBadges>
                                  <section className="py-10 md:p...">
                                    <div
                                      className="container"
-                                     bis_skin_checked="1"
                                    >
                                      <div
                                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6"
-                                       bis_skin_checked="1"
                                      >
                                        <div
                                          className="flex flex-col items-center text-center p-4 md:p-5 bg-white rounde..."
-                                         bis_skin_checked="1"
                                        >
                                          <div
                                            className="w-12 h-12 rounded-full bg-primary-light flex items-center justi..."
-                                           bis_skin_checked="1"
                                          >
                                          ...
                                        <div
                                          className="flex flex-col items-center text-center p-4 md:p-5 bg-white rounde..."
-                                         bis_skin_checked="1"
                                        >
                                          <div
                                            className="w-12 h-12 rounded-full bg-primary-light flex items-center justi..."
-                                           bis_skin_checked="1"
                                          >
                                          ...
                                        <div
                                          className="flex flex-col items-center text-center p-4 md:p-5 bg-white rounde..."
-                                         bis_skin_checked="1"
                                        >
                                          <div
                                            className="w-12 h-12 rounded-full bg-primary-light flex items-center justi..."
-                                           bis_skin_checked="1"
                                          >
                                          ...
                                        <div
                                          className="flex flex-col items-center text-center p-4 md:p-5 bg-white rounde..."
-                                         bis_skin_checked="1"
                                        >
                                          <div
                                            className="w-12 h-12 rounded-full bg-primary-light flex items-center justi..."
-                                           bis_skin_checked="1"
                                          >
                                          ...
                                        <div
                                          className="flex flex-col items-center text-center p-4 md:p-5 bg-white rounde..."
-                                         bis_skin_checked="1"
                                        >
                                          <div
                                            className="w-12 h-12 rounded-full bg-primary-light flex items-center justi..."
-                                           bis_skin_checked="1"
                                          >
                                          ...
                                        <div
                                          className="flex flex-col items-center text-center p-4 md:p-5 bg-white rounde..."
-                                         bis_skin_checked="1"
                                        >
                                          <div
                                            className="w-12 h-12 rounded-full bg-primary-light flex items-center justi..."
-                                           bis_skin_checked="1"
                                          >
                                          ...
                                <ProductSection title="Best Sellers" subtitle="Our most l..." featured={true} limit={8}>
                                  <section className="py-10 md:p...">
                                    <div
                                      className="container"
-                                     bis_skin_checked="1"
                                    >
                                      <div
                                        className="text-center mb-8 md:mb-10"
-                                       bis_skin_checked="1"
                                      >
                                      <div
                                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
-                                       bis_skin_checked="1"
                                      >
                                        <div
                                          className="space-y-3"
-                                         bis_skin_checked="1"
                                        >
                                          <div
                                            className="aspect-[3/4] rounded-xl skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                          <div
                                            className="h-4 w-3/4 rounded skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                          <div
                                            className="h-4 w-1/2 rounded skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                        <div
                                          className="space-y-3"
-                                         bis_skin_checked="1"
                                        >
                                          <div
                                            className="aspect-[3/4] rounded-xl skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                          <div
                                            className="h-4 w-3/4 rounded skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                          <div
                                            className="h-4 w-1/2 rounded skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                        <div
                                          className="space-y-3"
-                                         bis_skin_checked="1"
                                        >
                                          <div
                                            className="aspect-[3/4] rounded-xl skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                          <div
                                            className="h-4 w-3/4 rounded skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                          <div
                                            className="h-4 w-1/2 rounded skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                        <div
                                          className="space-y-3"
-                                         bis_skin_checked="1"
                                        >
                                          <div
                                            className="aspect-[3/4] rounded-xl skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                          <div
                                            className="h-4 w-3/4 rounded skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                          <div
                                            className="h-4 w-1/2 rounded skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                        <div
                                          className="space-y-3"
-                                         bis_skin_checked="1"
                                        >
                                          <div
                                            className="aspect-[3/4] rounded-xl skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                          <div
                                            className="h-4 w-3/4 rounded skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                          <div
                                            className="h-4 w-1/2 rounded skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                        <div
                                          className="space-y-3"
-                                         bis_skin_checked="1"
                                        >
                                          <div
                                            className="aspect-[3/4] rounded-xl skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                          <div
                                            className="h-4 w-3/4 rounded skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                          <div
                                            className="h-4 w-1/2 rounded skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                        <div
                                          className="space-y-3"
-                                         bis_skin_checked="1"
                                        >
                                          <div
                                            className="aspect-[3/4] rounded-xl skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                          <div
                                            className="h-4 w-3/4 rounded skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                          <div
                                            className="h-4 w-1/2 rounded skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                        <div
                                          className="space-y-3"
-                                         bis_skin_checked="1"
                                        >
                                          <div
                                            className="aspect-[3/4] rounded-xl skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                          <div
                                            className="h-4 w-3/4 rounded skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                          <div
                                            className="h-4 w-1/2 rounded skeleton-shimmer"
-                                           bis_skin_checked="1"
                                          >
                                <BrandStory>
                                  <section className="py-14 md:p...">
                                    <div
                                      className="container"
-                                     bis_skin_checked="1"
                                    >
                                      <div
                                        className="max-w-4xl mx-auto text-center"
-                                       bis_skin_checked="1"
                                      >
                                        <span>
                                        <h2>
                                        <div
                                          className="grid md:grid-cols-3 gap-8 mt-10"
-                                         bis_skin_checked="1"
                                        >
                                          <div
                                            className="space-y-3"
-                                           bis_skin_checked="1"
                                          >
                                            <div
                                              className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify..."
-                                             bis_skin_checked="1"
                                            >
+                                             🏭
                                            ...
                                          <div
                                            className="space-y-3"
-                                           bis_skin_checked="1"
                                          >
                                            <div
                                              className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify..."
-                                             bis_skin_checked="1"
                                            >
+                                             ✨
                                            ...
                                          <div
                                            className="space-y-3"
-                                           bis_skin_checked="1"
                                          >
                                            <div
                                              className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify..."
-                                             bis_skin_checked="1"
                                            >
+                                             💰
                                            ...
                                <Newsletter>
                                  <section className="bg-primary...">
                                    <div
                                      className="container text-center"
-                                     bis_skin_checked="1"
                                    >
                            <Footer>
                              <footer className="bg-hero-bg...">
                                <div
                                  className="container py-12 md:py-16"
-                                 bis_skin_checked="1"
                                >
                                  <div
                                    className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12"
-                                   bis_skin_checked="1"
                                  >
                                    <div
                                      className="col-span-2 md:col-span-1"
-                                     bis_skin_checked="1"
                                    >
                                      <LinkComponent href="/" className="inline-fle...">
                                        <a className="inline-fle..." ref={function} onClick={function onClick} ...>
                                          <div
                                            className="w-10 h-10 rounded-full bg-primary flex items-center justify-center"
-                                           bis_skin_checked="1"
                                          >
                                          <div
-                                           bis_skin_checked="1"
                                          >
                                      <p>
                                      <div
                                        className="space-y-2.5"
-                                       bis_skin_checked="1"
                                      >
                                    <div
-                                     bis_skin_checked="1"
                                    >
                                    <div
-                                     bis_skin_checked="1"
                                    >
                                    <div
-                                     bis_skin_checked="1"
                                    >
                                      <h3>
                                      <ul>
                                      <div
                                        className="flex items-center gap-3 mt-6"
-                                       bis_skin_checked="1"
                                      >
                                <div
                                  className="border-t border-white/10"
-                                 bis_skin_checked="1"
                                >
                                  <div
                                    className="container py-5 flex flex-col md:flex-row items-center justify-between g..."
-                                   bis_skin_checked="1"
                                  >
                                    <p>
                                    <div
                                      className="flex items-center gap-4"
-                                     bis_skin_checked="1"
                                    >
                                      <span>
                                      <div
                                        className="flex items-center gap-2 text-xs text-gray-400"
-                                       bis_skin_checked="1"
                                      >
                            ...
                  ...



    at div (<anonymous>:null:null)
    at <unknown> (src/components/home/HeroBanner.tsx:67:13)
    at Array.map (<anonymous>:null:null)
    at HeroBanner (src/components/home/HeroBanner.tsx:57:16)
    at HomePage (src\app\page.tsx:11:7)

## Code Frame
  65 |         >
  66 |           <div className="container h-full flex items-center">
> 67 |             <div className="max-w-xl text-white space-y-4 md:space-y-6">
     |             ^
  68 |               <span className="inline-block text-xs md:text-sm font-semibold tracking-[0.3em] uppercase text-white/80 animate-fade-in">
  69 |                 {banner.subtitle}
  70 |               </span>

Next.js version: 16.2.2 (Turbopack)
