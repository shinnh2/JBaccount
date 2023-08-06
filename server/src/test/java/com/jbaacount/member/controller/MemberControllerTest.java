package com.jbaacount.member.controller;

import com.google.gson.Gson;
import com.jbaacount.member.dto.request.MemberPatchDto;
import com.jbaacount.member.dto.request.MemberPostDto;
import com.jbaacount.member.dto.response.MemberResponseDto;
import com.jbaacount.member.entity.Member;
import com.jbaacount.member.mapper.MemberMapper;
import com.jbaacount.member.service.MemberService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.restdocs.AutoConfigureRestDocs;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.http.MediaType;
import org.springframework.restdocs.payload.JsonFieldType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static com.jbaacount.utils.AppDocumentUtils.getRequestPreProcessor;
import static com.jbaacount.utils.AppDocumentUtils.getResponsePreProcessor;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.when;
import static org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.document;
import static org.springframework.restdocs.mockmvc.RestDocumentationRequestBuilders.patch;
import static org.springframework.restdocs.mockmvc.RestDocumentationRequestBuilders.post;
import static org.springframework.restdocs.payload.PayloadDocumentation.*;
import static org.springframework.restdocs.request.RequestDocumentation.parameterWithName;
import static org.springframework.restdocs.request.RequestDocumentation.pathParameters;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(MemberController.class)
@MockBean(JpaMetamodelMappingContext.class)
@AutoConfigureMockMvc(addFilters = false)
@AutoConfigureRestDocs
class MemberControllerTest
{
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private MemberService memberService;


    @MockBean
    private MemberMapper memberMapper;


    @Autowired
    private Gson gson;

    @MockBean
    private RedisTemplate<String, String> redisTemplate;

    @MockBean
    private ValueOperations<String, String> valueOperations;

    @BeforeEach
    void beforeEach() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        MockitoAnnotations.initMocks(this);

    }

    @DisplayName("회원가입 테스트")
    @Test
    void signup() throws Exception
    {
        String email = "mike@ticonsys.com";
        String password = "123456789";
        String nickname = "오랜만에 외출";

        MemberPostDto postDto = new MemberPostDto();
        postDto.setEmail(email);
        postDto.setPassword(password);
        postDto.setNickname(nickname);

        String content = gson.toJson(postDto);

        Member member = Member.builder()
                .nickname(postDto.getNickname())
                .email(postDto.getEmail())
                .password(postDto.getPassword())
                .build();

        member.setId(1L);
        member.setCreatedAt(LocalDateTime.now());
        member.setModifiedAt(LocalDateTime.now());
        member.setRoles(List.of("USER", "ADMIN"));


        MemberResponseDto response = new MemberResponseDto();
        response.setId(member.getId());
        response.setNickname(member.getNickname());
        response.setEmail(member.getEmail());
        response.setRoles(member.getRoles());
        response.setCreatedAt(member.getCreatedAt());
        response.setModifiedAt(member.getModifiedAt());


        given(memberMapper.postToMember(any(MemberPostDto.class))).willReturn(member);

        given(memberService.createMember(Mockito.any(Member.class))).willReturn(member);

        given(memberMapper.memberToResponse(Mockito.any(Member.class))).willReturn(response);


        ResultActions actions = mockMvc
                .perform(post("/members/sign-up")
                .with(csrf())
                .accept(MediaType.APPLICATION_JSON)
                .contentType(MediaType.APPLICATION_JSON)
                .content(content));


        actions
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.nickname").value(postDto.getNickname()))
                .andExpect(jsonPath("$.data.email").value(postDto.getEmail()))
                .andDo(document("sign-up",
                        getRequestPreProcessor(),
                        getResponsePreProcessor(),
                        requestFields(
                                List.of(
                                        fieldWithPath("nickname").description("유저 닉네임"),
                                        fieldWithPath("email").description("유저 이메일"),
                                        fieldWithPath("password").description("유저 비밀번호"))
                                ),
                        responseFields(
                                List.of(
                                        fieldWithPath("data").type(JsonFieldType.OBJECT).description("결과 데이터"),
                                        fieldWithPath("data.id").type(JsonFieldType.NUMBER).description("유저 식별자"),
                                        fieldWithPath("data.nickname").type(JsonFieldType.STRING).description("유저 닉네임"),
                                        fieldWithPath("data.email").type(JsonFieldType.STRING).description("유저 이메일"),
                                        fieldWithPath("data.roles").type(JsonFieldType.ARRAY).description("유저 권한"),
                                        fieldWithPath("data.createdAt").type(JsonFieldType.STRING).description("회원가입 일자"),
                                        fieldWithPath("data.modifiedAt").type(JsonFieldType.STRING).description("유저 정보 수정 일자")
                                )
                        )));
    }


    @DisplayName("회원 정보 수정")
    @WithMockUser
    @Test
    void updateMember() throws Exception
    {
        long memberId = 1L;

        String nickname = "홍길동";

        Member memberRequest = Member.builder()
                .nickname("nickname")
                .email("mike@ticonsys.com")
                .password("123456789")
                .build();

        Member member = memberService.createMember(memberRequest);

        MemberPatchDto patch = new MemberPatchDto();
        patch.setNickname(nickname);
        String content = gson.toJson(patch);

        MemberResponseDto response = new MemberResponseDto();
        response.setId(memberId);
        response.setEmail("mike@ticonsys.com");
        response.setNickname(nickname);
        response.setRoles(List.of("ADMIN", "USER"));
        response.setCreatedAt(LocalDateTime.now());
        response.setModifiedAt(LocalDateTime.now());

        given(memberService.updateMember(anyLong(), any(MemberPatchDto.class), any(Member.class))).willReturn(member);

        System.out.println("returned Member = " + member);

        given(memberMapper.memberToResponse(member)).willReturn(response);


        ResultActions actions = mockMvc
                .perform(patch("/members/{member-id}", memberId)
                        .with(csrf())
                        .accept(MediaType.APPLICATION_JSON)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(content));

        actions
                .andExpect(status().isOk())
                //.andExpect(jsonPath("$.data.nickname").value(nickname))
                .andDo(document("patch-member",
                        getRequestPreProcessor(),
                        getResponsePreProcessor(),
                        pathParameters(
                                parameterWithName("member-id").description("유저 식별자")
                        ),
                        requestFields(
                                List.of(
                                        fieldWithPath("nickname").type(JsonFieldType.STRING).description("유저 닉네임")
                                )
                        ),
                        responseFields(
                                List.of(
                                        fieldWithPath("data").type(JsonFieldType.OBJECT).description("결과 데이터"),
                                        fieldWithPath("data.id").type(JsonFieldType.NUMBER).description("유저 식별자"),
                                        fieldWithPath("data.nickname").type(JsonFieldType.STRING).description("유저 닉네임"),
                                        fieldWithPath("data.email").type(JsonFieldType.STRING).description("유저 이메일"),
                                        fieldWithPath("data.roles").type(JsonFieldType.ARRAY).description("유저 권한"),
                                        fieldWithPath("data.createdAt").type(JsonFieldType.STRING).description("회원가입 일자"),
                                        fieldWithPath("data.modifiedAt").type(JsonFieldType.STRING).description("유저 정보 수정일자")
                                )
                        )
                ));
    }
}