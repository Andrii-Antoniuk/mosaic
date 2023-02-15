import ParentApp from 'Parent/App';

/** @namespace ReactApp/App */
class App extends ParentApp {
    renderContent() {
        return <>
            <p>This is written in the child theme in JS</p>
            { super.renderContent() }
        </>;
    }
}

/** @namespace Hello/Wo */
function test() {
    console.log('source');
}

test();

export default App;
