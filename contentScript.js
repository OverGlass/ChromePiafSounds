class ExtractPageVariable {
  constructor(variableName) {
    this._variableName = variableName;
    this._handShake = this._generateHandshake();
    this._inject();
    this._data = this._listen();
  }

  get data() {
    return this._data;
  }

  // Private

  _generateHandshake() {
    const array = new Uint32Array(5);
    return window.crypto.getRandomValues(array).toString();
  }

  _inject() {
    function propagateVariable(handShake, variableName) {
      const message = { handShake };
      message[variableName] = window[variableName];
      window.postMessage(message, "*");
    }

    const script = `( ${propagateVariable.toString()} )('${this._handShake}', '${this._variableName}');`
    const scriptTag = document.createElement('script');
    const scriptBody = document.createTextNode(script);

    scriptTag.id = 'chromeExtensionDataPropagator';
    scriptTag.appendChild(scriptBody);
    document.body.append(scriptTag);
  }

  _listen() {
    return new Promise(resolve => {
      window.addEventListener("message", ({ data }) => {
        // We only accept messages from ourselves
        if (data.handShake != this._handShake) return;
        resolve(data);
      }, false);
    })
  }
}

const windowData = new ExtractPageVariable('On_mp3').data;

windowData.then(data => {
  const payload = {
    piafname: document.title,
    urls: data.On_mp3
  }
  //loader
  let loader = document.createElement("div");
  let innerloader = document.createElement("div");
  let innerloader2 = document.createElement("div");
  loader.className = "lds-ripple";
  loader.prepend(innerloader)
  loader.prepend(innerloader2)
  let body = document.querySelector("body");
  body.prepend(loader);

  if (payload.urls) {
    fetch("http://localhost:8080/convert", {
      method: "post",
      body: JSON.stringify(payload)
    }).then((res) => {
      let nodeLoader = document.querySelector('.lds-ripple')
      nodeLoader.classList.add("off")
      const status = res.status;
      if (status === 201) {
        res.arrayBuffer().then((data) => {
          const blob = new Blob([data], { type: "application/zip" });
          const link = document.createElement("a");
          link.href = window.URL.createObjectURL(blob);
          link.download = payload.piafname.split(" ").join("_");
          link.click();
          window.URL.revokeObjectURL(link.href);
          link.remove();
        });
      } else {
        console.log(res);
        alert("pas de son à récupérer sur cette page");
      }
    })
  }
});