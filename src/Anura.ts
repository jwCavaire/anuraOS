declare var Filer: any;

const $ = document.querySelector.bind(document);

let taskbar = new Taskbar();
let launcher = new Launcher();
let contextMenu = new ContextMenu();

class Anura {
    x86: null | V86Backend;
    constructor() {
        if (localStorage.getItem("x86-enabled") === "true") {
            this.x86 = new V86Backend();
        }

        if (localStorage.getItem("use-expirimental-fs") === "true") {
            const script = document.createElement('script');
            script.src = "/assets/libs/filer.min.js"
            script.onload = () => {
                anura.fs = new Filer.FileSystem({
                    name: "anura-mainContext",
                    provider: new Filer.FileSystem.providers.IndexedDB()
                });
                anura.fs.readFileSync = async (path: string) => {
                    return await new Promise((resolve, reject) => {
                        return anura.fs.readFile(path, function async(err: any, data: any) {
                            resolve(new TextDecoder('utf8').decode(data))
                        })
                    })
                }
            }
            document.head.appendChild(script)
        }

        // Link to Google Fonts API for some reason (make this not link to external server soon)
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200';
        document.head.appendChild(link);


    }
    fs: any = undefined
    syncRead = {}
    apps: any = {}
    Version = "0.1.0 alpha"
    x86fs = {
        async read(path: string) {
            // return await new Promise((resolve, reject) => {
            //     return cheerpOSGetFileBlob([], "/files/" + path, async (blob) => {
            //         resolve(await blob.text())
            //     })
            // })
        },
        write(path: string, data: string) {
            // cheerpjAddStringFile(`/str/${path}`, data);
            // Depressingly, we can't actually transfer the file to /home without it crashing the users shell //
            // The user must do it themselves //
        }
    }
    async python(appname: string) {
        return await new Promise((resolve, reject) => {
            let iframe = document.createElement("iframe")
            iframe.style.display = "none"
            iframe.setAttribute("src", "/python.app/lib.html")
            iframe.id = appname
            iframe.onload = async function() {
                console.log("Called from python")
                let pythonInterpreter = (await document.getElementById(appname)! as unknown as any).contentWindow.loadPyodide({
                    stdin: () => {
                        let result = prompt();
                        // echo(result);
                        return result;
                    },
                });
                pythonInterpreter.globals.set('AliceWM', AliceWM)
                pythonInterpreter.globals.set('anura', this)
                resolve(pythonInterpreter)
            }
            document.body.appendChild(iframe)
        })
    }
    async registerApp(location: string) {


        let resp = await fetch(`${location}/manifest.json`);
        let manifest = await resp.json()


        let app = {
            name: manifest.name,
            location,
            manifest,
            windowinstance: null,
            async launch() {
                if (manifest.type == 'manual') { // This type of application is discouraged for sure but is the most powerful
                    fetch(`${location}/${manifest.handler}`)
                        .then(response => response.text())
                        .then((data) => {
                            top!.window.eval(data);
                            top!.window.eval(`loadingScript("${location}")`)
                        })
                } else {
                    if (this.windowinstance) return;
                    let win = AliceWM.create(this.manifest.wininfo, () => {
                        this.windowinstance = null;
                    });

                    let iframe: any = document.createElement("iframe")
                    iframe.style = "top:0; left:0; bottom:0; right:0; width:100%; height:100%; border:none; margin:0; padding:0;"
                    iframe.setAttribute("src", `${location}/${manifest.index}`);

                    win.content.appendChild(iframe);


                    // this.windowinstance = win;
                }
            },
        };

        launcher.addShortcut(manifest.name, manifest.icon ? `${location}/${manifest.icon}` : "", app.launch.bind(app));
        taskbar.addShortcut(`${location}/${manifest.icon}`,app.launch.bind(app));
        this.apps[manifest.package] = app;
        return app;
    }
    notifications = {
        async send(content: string, icon: string) {

            const container = document.getElementById("notif-container")
            let notificationElement = document.createElement("div");

            // some stuff, assigning icon and text, and CSS classes, here

            container?.appendChild(notificationElement);

            setTimeout(function(){
                notificationElement?.remove();
            }, 5000);

        }

    }

}
let anura = new Anura();

function openAppManager() {
    fetch("applicationmanager/launchapp.js")
        .then(response => response.text())
        .then((data) => {
            window.eval(data);
        })
}

window.addEventListener("load", () => {
    anura.registerApp("apps/browser.app");
    anura.registerApp("apps/term.app");
    anura.registerApp("apps/glxgears.app");
    anura.registerApp("apps/recursion.app");
    anura.registerApp("apps/eruda.app");
    anura.registerApp("apps/vnc.app");
    // anura.registerApp("apps/sshy.app");
    // ssh will be reworked later
    anura.registerApp("apps/fsapp.app");
    anura.registerApp("apps/chide.app");


    document.body.appendChild(contextMenu.element);
    document.body.appendChild(launcher.element);
    document.body.appendChild(taskbar.element);

    // taskbar.killself()
    (window as any).taskbar = taskbar;

});


//
// document.addEventListener("contextmenu", function(e) {
//     if (e.shiftKey) return;
//     e.preventDefault();

//     const menu: any = document.querySelector(".custom-menu");
//     menu.style.removeProperty("display");
//     menu.style.top = `${e.clientY}px`;
//     menu.style.left = `${e.clientX}px`;
// });

// document.addEventListener("click", (e) => {
//     if (e.button != 0) return;
//     (document.querySelector(".custom-menu")! as HTMLElement).style.setProperty("display", "none");
// });
//

(window as any).anura = anura;
