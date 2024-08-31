import { ChangeEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../components/Input";
import Button from "../components/Button";
import IconAdd from "../assets/icon_add.svg";
import React from "react";
import { DragDropContext } from "react-beautiful-dnd";
import { StrictModeDroppable as Droppable } from "../components/StrictModeDroppable";
import AdminBoardItem from "../components/AdminBoardItem";
import axios from "axios";
import { getAccessToken } from "../assets/tokenActions";

interface BoradCatgoryItem {
	id: number;
	name: string;
	type: "Board" | "Category";
	orderIndex: number;
	category: any[];
	parentId?: number;
}

//보드 생성
const InnerList = React.memo(function InnerList({
	board,
	category,
	index,
	editCategory,
	editData,
	fetchData,
	fetchMenuData,
}: any) {
	return (
		<AdminBoardItem
			board={board}
			category={category}
			index={index}
			editCategory={editCategory}
			editData={editData}
			fetchData={fetchData}
			fetchMenuData={fetchMenuData}
		/>
	);
});

const Admin = ({ fetchMenuData }: { fetchMenuData: () => Promise<void> }) => {
	const api = process.env.REACT_APP_API_URL;
	const navigate = useNavigate();
	const [boardListData, setBoardListData] = useState<any>(null);
	const [newBoard, setNewBoard] = useState("");
	const [isAdminOnlyBoard, setIsAdminOnlyBoard] = useState<boolean>(false);

	const fetchDataMap = () => {
		axios
			.get(`${api}/api/v1/board/menu`)
			.then((response) => {
				//데이터 맵 생성
				const boardMap: any = { boards: {} };
				boardMap.boardsOrder = [];
				response.data.data.forEach((el: any) => {
					boardMap.boards[`board-${el.id}`] = el;
					boardMap.boardsOrder.push(`board-${el.id}`);
				});
				setBoardListData(boardMap);
			})
			.catch((error) => {
				console.error("에러", error);
			});
	};

	useEffect(() => {
		fetchDataMap();
	}, []);

	//게시판 생성하기
	const handleClickCreateBoard = () => {
		const newBoardData = {
			name: newBoard,
			isAdminOnly: isAdminOnlyBoard,
		};
		const postAxiosConfig = {
			headers: {
				"Content-Type": "application/json",
				Authorization: `${getAccessToken()}`,
			},
		};
		axios
			.post(
				`${api}/api/v1/admin/manage/board/create`,
				newBoardData,
				postAxiosConfig
			)
			.then((response) => {
				alert("게시판이 추가되었습니다.");
				setNewBoard("");
				fetchDataMap();
				fetchMenuData();
			})
			.catch((error) => {
				console.error("에러", error);
			});
	};
	const setInputValueNewBoard = (value: string) => {
		setNewBoard(value);
	};
	const handleSetIsAdminOnlyCheck = (event: ChangeEvent<HTMLInputElement>) => {
		if (event.target.checked) setIsAdminOnlyBoard(true);
		else setIsAdminOnlyBoard(false);
	};

	//게시판명 및 카테고리명 수정하기
	const editData = (
		dataType: "board" | "category",
		boardId: any,
		categoryIndex: any,
		newName: string
	) => {
		if (boardListData) {
			const newBoard = boardListData.boards[`board-${boardId}`];
			if (dataType === "board") {
				newBoard.name = newName;
			}
			if (dataType === "category") {
				newBoard.category[categoryIndex].categoryName = newName;
			}
			setBoardListData({
				...boardListData,
				boards: {
					...boardListData.boards,
					[`board-${boardId}`]: newBoard,
				},
			});
		}
	};

	const handlerOnDragEnd = (result: any) => {
		const { destination, source, draggableId, type } = result;

		// console.log("source", source); //드래그 되기 전 위치: ex) {index: 0, droppableId: 'column1'}
		// console.log("destination", destination); //드래그 된 후 위치: ex) {droppableId: 'column2', index: 0}
		// console.log("draggableId", draggableId); //드래그 대상의 아이디: ex) draggableId task1
		// console.log("type", type); //드래그 대상의 타입: ex) type task

		//드래그 된 곳이 없을 경우
		if (!destination) {
			return;
		}

		//드래그 하기 전 위치와 드래그 된 후의 위치가 같을 경우
		if (
			destination.droppableId === source.droppableId &&
			destination.index === source.index
		) {
			return;
		}

		//보드 이동 처리
		if (type === "board") {
			const newBoardOrder = Array.from(boardListData.boardsOrder);
			newBoardOrder.splice(source.index, 1);
			newBoardOrder.splice(destination.index, 0, draggableId);

			setBoardListData({
				...boardListData,
				boardsOrder: newBoardOrder,
			});
			return;
		}

		//카테고리 이동 출발, 도착 지점 설정
		const start = boardListData.boards[source.droppableId]; //드래그 되기 전 위치(열)
		const finish = boardListData.boards[destination.droppableId]; //드래그 되기 후 위치(열)

		//시작지점에서 카테고리 정보 추출
		const draggedCategoryId = draggableId.split("-")[1]; //드래그된 카테고리 아이디 "1"
		const startCategorys = Array.from(start.category); //시작지점의 카테고리
		//(시작지점에서 추출한) 드래그된 카테고리의 정보
		const draggedCategory = startCategorys.filter(
			(el: any) => el.id === +draggedCategoryId
		)[0]; //이게 오래 걸리면... 카테고리도 맵 생각해봐야 할듯

		//보드 내 카테고리 이동 처리
		if (start === finish) {
			startCategorys.splice(source.index, 1);
			startCategorys.splice(destination.index, 0, draggedCategory);

			const newStartBoard = {
				...start,
				category: startCategorys,
			};

			setBoardListData({
				...boardListData,
				boards: {
					...boardListData.boards,
					[`board-${newStartBoard.id}`]: newStartBoard,
				},
			});
			return;
		}

		//나머지 (보드 외 카테고리 이동) 처리
		startCategorys.splice(source.index, 1);
		const newStartBoard = {
			...start,
			category: startCategorys,
		};

		const finishCategorys = Array.from(finish.category);
		finishCategorys.splice(destination.index, 0, draggedCategory);
		const newFinishBoard = {
			...finish,
			category: finishCategorys,
		};

		setBoardListData({
			...boardListData,
			boards: {
				...boardListData.boards,
				[`board-${newStartBoard.id}`]: newStartBoard,
				[`board-${newFinishBoard.id}`]: newFinishBoard,
			},
		});
	};

	//게시판 및 카테고리 수정 완료
	const handleClickSubmit = () => {
		const boardDataArray: any[] = [];
		let boardOrderIndex = 0;
		//데이터 변경 작업
		for (let boardId of boardListData.boardsOrder) {
			const nowBoard = boardListData.boards[boardId];
			// nowBoard.boardId = nowBoard.id; //API 이름이 달라서 키 명 변경: 확인 필요
			// delete nowBoard.id; //API 이름이 달라서 키 명 변경: 확인 필요
			if (!nowBoard.isDeleted) {
				boardOrderIndex = boardOrderIndex + 1;
				nowBoard.orderIndex = boardOrderIndex;
			}
			if (nowBoard.category.length > 0) {
				let categoryOrderIndex = 0;
				for (let categoryItem of nowBoard.category) {
					// categoryItem.categoryId = categoryItem.id;
					// delete categoryItem.id;
					if (!categoryItem.isDeleted) {
						categoryOrderIndex += 1;
						categoryItem.orderIndex = categoryOrderIndex;
					}
				}
			}
			boardDataArray.push(nowBoard);
		}

		const postAxiosConfig = {
			headers: {
				"Content-Type": "application/json",
				Authorization: `${getAccessToken()}`,
			},
		};
		axios
			.patch(
				`${api}/api/v1/admin/manage/update`,
				boardDataArray,
				postAxiosConfig
			)
			.then((response) => {
				alert("게시판 수정이 완료되었습니다.");
				fetchDataMap();
				fetchMenuData();
			})
			.catch((err) => {
				console.log(err);
				alert("게시판 수정에 실패했습니다.");
			});
	};

	return (
		<div className="admin_wrap">
			<h3 className="admin_title">관리자 페이지</h3>
			<p className="admin_board_desc">
				드래그 앤 드롭으로 게시판 및 카테고리 순서를 변경할 수 있습니다.
			</p>

			{boardListData ? (
				<DragDropContext onDragEnd={handlerOnDragEnd}>
					<Droppable droppableId="all-boards" direction="vertical" type="board">
						{(provided) => (
							<div
								className="admin_board_list_wrap"
								ref={provided.innerRef}
								{...provided.droppableProps}
							>
								{boardListData.boardsOrder.map((boardId: any, index: any) => {
									return (
										<InnerList
											key={boardId}
											board={boardListData.boards[boardId]}
											category={boardListData.boards[boardId].category}
											index={index}
											editData={editData}
											fetchData={fetchDataMap}
											fetchMenuData={fetchMenuData}
										/>
									);
								})}
								{provided.placeholder}
							</div>
						)}
					</Droppable>
				</DragDropContext>
			) : (
				"로딩중"
			)}

			<div className="admin_board_create_wrap">
				<h4 className="title">새 게시판 추가하기</h4>
				<Input
					InputLabel="새 게시판 이름"
					isLabel={false}
					inputAttr={{
						type: "text",
						placeholder: "새 게시판 이름을 입력하세요",
					}}
					setInputValue={setInputValueNewBoard}
					inputValue={newBoard}
				>
					<button className="add_board_btn" onClick={handleClickCreateBoard}>
						<img src={IconAdd} alt="게시판 추가 버튼 아이콘" />
					</button>
				</Input>
				<div className="isAdminOnly_check_wrap">
					<input
						type="checkbox"
						id="isAdminOnlyCheck"
						onChange={(e) => handleSetIsAdminOnlyCheck(e)}
					/>
					<label htmlFor="isAdminOnlyCheck">관리자만 작성 가능</label>
				</div>
			</div>

			<div className="admin_button_wrap">
				<Button
					buttonType="primary"
					buttonSize="big"
					buttonLabel="게시글 수정 완료"
					onClick={handleClickSubmit}
				/>
				<Button
					buttonType="no_em"
					buttonSize="big"
					buttonLabel="취소"
					onClick={() => navigate("./")}
				/>
			</div>
		</div>
	);
};
export default Admin;
