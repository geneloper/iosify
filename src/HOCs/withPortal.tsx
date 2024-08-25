import { createPortal } from 'react-dom';
import styles from './styles.module.scss';

function createDiv(): HTMLDivElement {
    let div = document.querySelector('#iosify') as HTMLDivElement;

    console.log(div)
    if (!div) {
        div  = document.createElement('div')
        div.className = styles.iosify
        div.id = 'iosify'
        document.body.appendChild(div)
    }

    return div
}

function withPortal<P extends JSX.IntrinsicAttributes>(WrappedComponent: React.ComponentType<P>) {
    return (props: P) => {
        const container = createDiv()

        return createPortal(<WrappedComponent {...props}/>, container)
    }
}

export default withPortal