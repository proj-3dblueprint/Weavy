import { Fragment, ReactNode } from 'react';
import './ErrorDisplay.css';

type ActionObject = { label: string; onClick: () => void };

interface ErrorDisplayProps {
  icon: ReactNode;
  title: string | ReactNode;
  description: string | ReactNode;
  actions: React.ReactNode[] | ActionObject[];
}

const isNotEmpty = (
  action: ReactNode | ActionObject,
): action is Exclude<ReactNode, null | undefined> | ActionObject => {
  return !!action;
};

const isActionObject = (action: ReactNode | ActionObject): action is ActionObject => {
  return !!action && typeof action === 'object' && 'label' in action;
};

export const ErrorDisplay = ({ icon, title, description, actions }: ErrorDisplayProps) => {
  const filteredActions = actions.filter(isNotEmpty);

  return (
    <div className="error-display-container">
      <div className="error-display">
        <div className="error-display-info">
          <div className="error-display-icon">{icon}</div>
          <div className="error-display-text-container">
            <div className="error-display-title">{title}</div>
            <div className="error-display-description">{description}</div>
          </div>
        </div>
        <div className="error-display-actions">
          {filteredActions.map((action: Exclude<ReactNode, null | undefined> | ActionObject, index) =>
            isActionObject(action) ? (
              <button key={index} className="error-display-action-button" onClick={action.onClick}>
                {action.label}
              </button>
            ) : (
              <Fragment key={index}>{action}</Fragment>
            ),
          )}
        </div>
      </div>
    </div>
  );
};
