import React from "react";
import "../App.css";

export interface ButtonProps {
	buttonType: "primary" | "em" | "cancel" | "another" | "error" | "no_em";
	buttonSize: "big" | "small";
	buttonLabel: string;
	onClick?: () => void;
	onKeyPress?: (event: React.KeyboardEvent<HTMLElement>) => void;
	type?: "button" | "submit" | "reset";
}

const Button = ({
	buttonType,
	buttonSize,
	buttonLabel,
	...props
}: ButtonProps) => {
	return (
		<button className={`${buttonType} ${buttonSize}`} {...props}>
			{buttonLabel}
		</button>
	);
};
export default Button;
